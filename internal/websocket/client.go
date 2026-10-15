package websocket

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"log/slog"
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

const (
	closeGraceTimeout     = 2 * time.Second
	defaultPingInterval   = 30 * time.Second
	initialReconnectDelay = 2 * time.Second
	defaultMaxDelay       = 30 * time.Second
	pongWaitBuffer        = 10 * time.Second
)

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

	// Resilience configuration
	cfgMu             sync.RWMutex
	pingInterval      time.Duration
	autoReconnect     bool
	maxReconnectDelay time.Duration
	maxReconnectTries int

	// Target memory for auto-reconnect
	targetMu sync.RWMutex
	lastURL  string
	lastTLS  *tls.Config

	// Goroutine cancellation
	heartbeatCancel context.CancelFunc
	reconnectCancel context.CancelFunc
	isReconnecting  bool
}

// New creates a new WebSocket client with default resilience options.
func New() *Client {
	return &Client{
		pingInterval:      defaultPingInterval,
		autoReconnect:     true,
		maxReconnectDelay: defaultMaxDelay,
		maxReconnectTries: 0,
	}
}

// SetConnectionConfig updates the heartbeat and auto-reconnect behavior.
// Setting pingIntervalSec to 0 or negative disables the keep-alive ping.
func (c *Client) SetConnectionConfig(pingIntervalSec int, autoReconnect bool, maxDelaySec int, maxTries int) {
	c.cfgMu.Lock()
	defer c.cfgMu.Unlock()

	if pingIntervalSec <= 0 {
		c.pingInterval = 0
	} else {
		c.pingInterval = time.Duration(pingIntervalSec) * time.Second
	}

	c.autoReconnect = autoReconnect

	if maxDelaySec <= 0 {
		c.maxReconnectDelay = defaultMaxDelay
	} else {
		c.maxReconnectDelay = time.Duration(maxDelaySec) * time.Second
	}

	c.maxReconnectTries = maxTries
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

	// Cancel any active reconnect loop since user/system initiated Connect
	if c.reconnectCancel != nil {
		c.reconnectCancel()
		c.reconnectCancel = nil
	}
	c.connMu.Unlock()

	// Remember target for potential auto-reconnect
	c.targetMu.Lock()
	c.lastURL = url
	c.lastTLS = tlsConfig
	c.targetMu.Unlock()

	dialer := websocket.Dialer{TLSClientConfig: tlsConfig}

	conn, _, err := dialer.DialContext(ctx, url, http.Header{})
	if err != nil {
		return fmt.Errorf("connect websocket: %w", err)
	}

	c.connMu.Lock()
	c.conn = conn
	c.closeOnce = &sync.Once{}
	c.connMu.Unlock()

	c.startHeartbeat(conn)

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
	c.connMu.Lock()
	// Cancel any active reconnect attempts
	if c.reconnectCancel != nil {
		c.reconnectCancel()
		c.reconnectCancel = nil
	}
	// Cancel heartbeat
	if c.heartbeatCancel != nil {
		c.heartbeatCancel()
		c.heartbeatCancel = nil
	}
	conn := c.conn
	c.connMu.Unlock()

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

func (c *Client) startHeartbeat(conn *websocket.Conn) {
	c.cfgMu.RLock()
	interval := c.pingInterval
	c.cfgMu.RUnlock()

	if interval <= 0 {
		return
	}

	pongWait := interval + pongWaitBuffer
	_ = conn.SetReadDeadline(time.Now().Add(pongWait))

	conn.SetPongHandler(func(appData string) error {
		slog.Debug("websocket pong received", "appData", appData)
		_ = conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	ctx, cancel := context.WithCancel(context.Background())
	c.connMu.Lock()
	if c.heartbeatCancel != nil {
		c.heartbeatCancel()
	}
	c.heartbeatCancel = cancel
	c.connMu.Unlock()

	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				c.writeMu.Lock()
				slog.Debug("sending websocket ping")
				err := conn.WriteControl(
					websocket.PingMessage,
					[]byte{},
					time.Now().Add(5*time.Second),
				)
				c.writeMu.Unlock()

				if err != nil {
					slog.Debug("failed to write ping control frame", "error", err)
					c.finish(conn, err)
					return
				}
			}
		}
	}()
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
// read failure (err != nil).
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
		if c.heartbeatCancel != nil {
			c.heartbeatCancel()
			c.heartbeatCancel = nil
		}
		c.connMu.Unlock()

		_ = conn.Close()

		if c.OnDisconnect != nil {
			c.OnDisconnect(err)
		}

		if err != nil {
			c.triggerAutoReconnect()
		}
	})
}

func (c *Client) triggerAutoReconnect() {
	c.cfgMu.RLock()
	enabled := c.autoReconnect
	maxDelay := c.maxReconnectDelay
	maxTries := c.maxReconnectTries
	c.cfgMu.RUnlock()

	if !enabled {
		return
	}

	c.targetMu.RLock()
	targetURL := c.lastURL
	tlsCfg := c.lastTLS
	c.targetMu.RUnlock()

	if targetURL == "" {
		return
	}

	c.connMu.Lock()
	if c.isReconnecting {
		c.connMu.Unlock()
		return
	}
	c.isReconnecting = true
	ctx, cancel := context.WithCancel(context.Background())
	c.reconnectCancel = cancel
	c.connMu.Unlock()

	go func() {
		defer func() {
			c.connMu.Lock()
			c.isReconnecting = false
			c.connMu.Unlock()
		}()

		delay := initialReconnectDelay
		attempt := 1

		for {
			if maxTries > 0 && attempt > maxTries {
				slog.Debug("auto-reconnect reached max attempts", "maxTries", maxTries)
				return
			}

			slog.Debug("waiting to auto-reconnect", "attempt", attempt, "delay", delay)

			select {
			case <-ctx.Done():
				slog.Debug("auto-reconnect cancelled")
				return
			case <-time.After(delay):
			}

			// Check if already connected by another call
			if c.Connected() {
				return
			}

			slog.Debug("attempting auto-reconnect", "attempt", attempt, "url", targetURL)
			err := c.Connect(ctx, targetURL, tlsCfg)
			if err == nil {
				slog.Debug("auto-reconnect succeeded", "attempt", attempt)
				return
			}

			slog.Debug("auto-reconnect attempt failed", "attempt", attempt, "error", err)

			attempt++
			delay *= 2
			if delay > maxDelay {
				delay = maxDelay
			}
		}
	}()
}

