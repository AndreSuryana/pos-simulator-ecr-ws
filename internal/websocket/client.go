package websocket

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var (
	// ErrAlreadyConnected is returned by Connect when a connection is
	// already active.
	ErrAlreadyConnected = errors.New("websocket already connected")

	// ErrNotConnected is returned by Send when there is no active
	// connection.
	ErrNotConnected = errors.New("websocket not connected")
)

// closeGraceTimeout bounds how long Disconnect waits while writing the
// close control frame before tearing down the connection regardless.
const closeGraceTimeout = 2 * time.Second

// Client manages a single WebSocket connection.
//
// Safe for concurrent use: Send may be called from multiple goroutines
// (writes are serialized internally, as required by gorilla/websocket),
// and a user-initiated Disconnect racing an in-flight read failure will
// never fire OnDisconnect more than once for the same connection.
type Client struct {
	connMu sync.RWMutex
	conn   *websocket.Conn

	// writeMu serializes all writes (data + control frames) to conn.
	// gorilla/websocket permits only one concurrent writer.
	writeMu sync.Mutex

	// closeOnce guards teardown for the *current* connection. It is
	// replaced with a fresh sync.Once on every successful Connect, so
	// each connection's lifecycle is torn down exactly once.
	closeOnce *sync.Once

	// OnConnect is called after a successful connection.
	OnConnect func()

	// OnDisconnect is called exactly once per connection, whether closed
	// by the user (err == nil) or by a read/connection failure (err != nil).
	OnDisconnect func(error)

	// OnMessage is called for each received text/binary message.
	OnMessage func([]byte)
}

// New creates a new WebSocket client.
func New() *Client {
	return &Client{}
}

// Connected reports whether the client is currently connected.
func (c *Client) Connected() bool {
	c.connMu.RLock()
	defer c.connMu.RUnlock()

	return c.conn != nil
}

// Connect establishes a WebSocket connection and starts the background
// read loop. OnConnect fires synchronously on success, before Connect
// returns.
func (c *Client) Connect(ctx context.Context, url string, tlsConfig *tls.Config) error {
	c.connMu.Lock()
	if c.conn != nil {
		c.connMu.Unlock()
		return ErrAlreadyConnected
	}
	c.connMu.Unlock()

	dialer := websocket.Dialer{TLSClientConfig: tlsConfig}

	conn, _, err := dialer.DialContext(ctx, url, http.Header{})
	if err != nil {
		return fmt.Errorf("connect websocket: %w", err)
	}

	c.connMu.Lock()
	c.conn = conn
	c.closeOnce = &sync.Once{}
	c.connMu.Unlock()

	go c.readLoop(conn)

	if c.OnConnect != nil {
		c.OnConnect()
	}

	return nil
}

// Disconnect performs a graceful, user-initiated close: it sends a
// WebSocket close frame (best-effort, bounded by closeGraceTimeout), then
// tears down the connection. OnDisconnect(nil) fires exactly once, even if
// a read error is concurrently tearing down the same connection.
func (c *Client) Disconnect() error {
	c.connMu.RLock()
	conn := c.conn
	c.connMu.RUnlock()

	if conn == nil {
		return nil
	}

	c.writeMu.Lock()
	closeErr := conn.WriteControl(
		websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""),
		time.Now().Add(closeGraceTimeout),
	)
	c.writeMu.Unlock()

	c.finish(conn, nil)
	return closeErr
}

// Send writes a text message. Safe for concurrent callers.
func (c *Client) Send(data []byte) error {
	c.connMu.RLock()
	conn := c.conn
	c.connMu.RUnlock()

	if conn == nil {
		return ErrNotConnected
	}

	c.writeMu.Lock()
	defer c.writeMu.Unlock()

	if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
		return fmt.Errorf("send websocket message: %w", err)
	}

	return nil
}

// readLoop reads messages until the connection errors or is closed
// elsewhere. conn is captured at goroutine start so a later Connect()
// (reconnect) can never be torn down by a stale readLoop.
func (c *Client) readLoop(conn *websocket.Conn) {
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			c.finish(conn, err)
			return
		}

		if c.OnMessage != nil {
			c.OnMessage(message)
		}
	}
}

// finish tears down state and fires OnDisconnect exactly once for conn,
// regardless of whether it was triggered by Disconnect() (err == nil) or a
// read failure (err != nil). This is what prevents the double-fire/double-
// close race between a user-initiated Disconnect and a concurrent read
// error on the same connection.
func (c *Client) finish(conn *websocket.Conn, err error) {
	c.connMu.RLock()
	once := c.closeOnce
	c.connMu.RUnlock()

	if once == nil {
		return
	}

	once.Do(func() {
		c.connMu.Lock()
		if c.conn == conn {
			c.conn = nil
		}
		c.connMu.Unlock()

		_ = conn.Close()

		if c.OnDisconnect != nil {
			c.OnDisconnect(err)
		}
	})
}
