package websocket

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func TestClient_ConnectionConfig(t *testing.T) {
	c := New()
	if !c.autoReconnect {
		t.Errorf("expected default autoReconnect to be true")
	}

	c.SetConnectionConfig(false, 45, 3)

	c.cfgMu.RLock()
	autoReconn := c.autoReconnect
	maxDelay := c.maxReconnectDelay
	maxTries := c.maxReconnectTries
	c.cfgMu.RUnlock()

	if autoReconn != false {
		t.Errorf("expected autoReconnect false, got %v", autoReconn)
	}
	if maxDelay != 45*time.Second {
		t.Errorf("expected maxReconnectDelay 45s, got %v", maxDelay)
	}
	if maxTries != 3 {
		t.Errorf("expected maxReconnectTries 3, got %v", maxTries)
	}
}

func TestClient_NotConnected(t *testing.T) {
	c := New()
	if c.Connected() {
		t.Errorf("new client should not be connected")
	}

	err := c.Send([]byte("hello"))
	if err != ErrNotConnected {
		t.Errorf("expected ErrNotConnected, got %v", err)
	}

	// Disconnecting an already disconnected client should be a no-op
	if err := c.Disconnect(); err != nil {
		t.Errorf("disconnect on idle client returned error: %v", err)
	}
}

func TestClient_ConnectAndEcho(t *testing.T) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		for {
			mt, msg, err := conn.ReadMessage()
			if err != nil {
				break
			}
			if err := conn.WriteMessage(mt, msg); err != nil {
				break
			}
		}
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")

	c := New()
	c.SetConnectionConfig(false, 5, 1)

	connectedCh := make(chan struct{}, 1)
	c.OnConnect = func() {
		connectedCh <- struct{}{}
	}

	receivedCh := make(chan string, 1)
	c.OnMessage = func(data []byte) {
		receivedCh <- string(data)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := c.Connect(ctx, wsURL, nil); err != nil {
		t.Fatalf("failed to connect: %v", err)
	}

	select {
	case <-connectedCh:
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for OnConnect")
	}

	if !c.Connected() {
		t.Errorf("client reports not connected after OnConnect")
	}

	// Test sending a message
	testMsg := "ping-test-123"
	if err := c.Send([]byte(testMsg)); err != nil {
		t.Fatalf("send failed: %v", err)
	}

	select {
	case echo := <-receivedCh:
		if echo != testMsg {
			t.Errorf("expected echo %q, got %q", testMsg, echo)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for echoed message")
	}

	// Test clean disconnect
	if err := c.Disconnect(); err != nil {
		t.Fatalf("disconnect returned error: %v", err)
	}

	if c.Connected() {
		t.Errorf("expected client to be disconnected")
	}
}

func TestClient_AutoReconnect(t *testing.T) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	var activeConn atomic.Pointer[websocket.Conn]

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		activeConn.Store(conn)
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")

	c := New()
	c.SetConnectionConfig(true, 5, 3)

	var connectCount atomic.Int32
	connectCh := make(chan struct{}, 5)
	c.OnConnect = func() {
		connectCount.Add(1)
		connectCh <- struct{}{}
	}

	attemptCh := make(chan int, 5)
	c.OnReconnectAttempt = func(attempt int, maxTries int, delay time.Duration) {
		attemptCh <- attempt
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := c.Connect(ctx, wsURL, nil); err != nil {
		t.Fatalf("initial connect failed: %v", err)
	}

	select {
	case <-connectCh:
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for initial connect")
	}

	// Abruptly close the server-side connection to trigger unexpected drop
	conn := activeConn.Load()
	if conn == nil {
		t.Fatal("no active server connection")
	}
	_ = conn.Close()

	// Verify reconnect attempt triggers
	select {
	case attempt := <-attemptCh:
		if attempt != 1 {
			t.Errorf("expected attempt 1, got %d", attempt)
		}
	case <-time.After(4 * time.Second):
		t.Fatal("timed out waiting for OnReconnectAttempt")
	}

	// Verify client reconnects successfully to the server
	select {
	case <-connectCh:
		// Reconnect successful
	case <-time.After(5 * time.Second):
		t.Fatal("timed out waiting for reconnect OnConnect")
	}

	if !c.Connected() {
		t.Errorf("client should be connected after auto-reconnect")
	}

	_ = c.Disconnect()
}
