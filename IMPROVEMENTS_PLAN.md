# Implementation Plan: POS ECR Simulator Core Improvements

**Branch:** `feature/core-enhancements`  
**Reference:** User feedback on `improvements_plan.md`

---

## 1. Feature Specifications

### 1.1 Transaction Response via Toast
- **Backend**:
  In [`app.go`](file:///D:/WorkProjects/pos-simulator-ecr-websocket/app.go), `handleTransaction` emits the parsed response to the frontend:
  ```go
  func (a *App) handleTransaction(data []byte) error {
      resp, err := a.transaction.Handle(data)
      if err != nil {
          return err
      }
      runtime.EventsEmit(a.ctx, "transaction:response", resp)
      return nil
  }
  ```
- **Frontend**:
  Listen to `transaction:response` via `EventsOn` and display styled toasts via `react-hot-toast`:
  - **Approved (`00`)**:
    ```tsx
    toast.success("Transaction Approved");
    ```
  - **Declined / Failed**:
    Normalize `responseMessage` (normalize underscores and casing to sentence case) and format as `"${msg} (${code})"`. Failover format is `"Transaction Failed (unknown)"`:
    ```tsx
    const code = resp?.data_transaction?.responseCode?.trim() || "unknown";
    const rawMsg = resp?.data_transaction?.responseMessage?.trim();

    let formattedMsg = "Transaction Failed";
    if (rawMsg) {
      const cleaned = rawMsg.replace(/_/g, " ").trim();
      formattedMsg = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    }

    toast.error(`${formattedMsg} (${code})`);
    ```

### 1.2 LogConsole Instant Search
- In [`LogConsole.tsx`](file:///D:/WorkProjects/pos-simulator-ecr-websocket/frontend/src/components/LogConsole.tsx):
  - Add search input positioned on the **right side** of the console header, directly before the "Clear" button.
  - Filters logs immediately as the user types (no search button needed).
  - Keeps console header layout clean:
    ```tsx
    {/* Left: Title & Count */}
    <div className="flex items-center gap-3">
      <span className="font-semibold text-content-primary">Terminal Logs</span>
      <span className="bg-app-overlay text-content-muted px-2 py-0.5 rounded-full text-[10px] font-mono">
        {filteredLogs.length}{searchTerm ? ` / ${logs.length}` : ""}
      </span>
    </div>

    {/* Right: Instant Search + Clear */}
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-app-base border border-app-border rounded px-2 py-1 text-xs focus-within:border-brand-primary transition-colors">
        <Search className="w-3.5 h-3.5 text-content-muted shrink-0" />
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-content-primary placeholder:text-content-muted w-32 focus:w-48 transition-all font-mono text-[11px]"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="text-content-muted hover:text-content-primary"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <button onClick={onClear} ...>
        <Trash2 className="w-3.5 h-3.5" />
        <span>Clear</span>
      </button>
    </div>
    ```

---

## 2. WebSocket Resilience & Configuration

### 2.1 Configuration Schema
In [`internal/config/config.go`](file:///D:/WorkProjects/pos-simulator-ecr-websocket/internal/config/config.go), add `Connection` settings:
```go
type Connection struct {
    PingIntervalSeconds      int  `json:"pingIntervalSeconds"`      // default: 30, 0 to disable
    AutoReconnect            bool `json:"autoReconnect"`            // default: true
    MaxReconnectDelaySeconds int  `json:"maxReconnectDelaySeconds"` // default: 30
    MaxReconnectTries        int  `json:"maxReconnectTries"`        // default: 0 (infinite)
}
```
- **Initial Reconnect Delay**: Fixed constant in Go code (`const initialReconnectDelay = 2 * time.Second`).
- **Max Delay**: Capped by user setting `MaxReconnectDelaySeconds` (default: 30s).
- **Max Tries**: Default `0` (infinite retry until reconnected or user disconnects).

### 2.2 WebSocket Heartbeat (Ping/Pong)
In [`internal/websocket/client.go`](file:///D:/WorkProjects/pos-simulator-ecr-websocket/internal/websocket/client.go):
- Spawn background heartbeat goroutine on `Connect()` if `PingIntervalSeconds > 0`.
- Send RFC 6455 `websocket.PingMessage` every interval.
- Update read deadline upon receiving `Pong`.
- **Debug Logging**: Log ping/pong events using `slog.Debug()` only. **Do NOT emit to frontend log event**, keeping the terminal logs view free of noise.

### 2.3 Auto-Reconnect with Exponential Backoff
- When disconnection occurs due to network/server drop (`finish(conn, err)` with `err != nil`):
  - If `AutoReconnect` is enabled, attempt reconnecting in background.
  - Backoff: `2s -> 4s -> 8s -> 16s -> ... capped at MaxReconnectDelaySeconds`.
  - Max tries: if `MaxReconnectTries > 0`, stop after reaching limit; if `0`, retry infinitely.
  - **Debug Logging**: Reconnect attempts logged via `slog.Debug()` only.

---

## 3. Settings UI Visualization

The existing "TLS Configuration" card in [`SettingView.tsx`](file:///D:/WorkProjects/pos-simulator-ecr-websocket/frontend/src/components/SettingView.tsx) is renamed to **"Connection"** with a `Radio` / `Wifi` icon. WebSocket Heartbeat & Auto-Reconnect settings are placed directly before the TLS Mode settings:

```text
+-----------------------------------------------------------------------------------------+
| System Configuration                                                                [X] |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [Sliders] GENERAL SETTINGS                                                             |
|  POS ID: [POS-AW12       ]   MID: [BRIAW006        ]   Trx ID Length: [14        ]      |
|                                                                                         |
|  [KeyRound] AUTHENTICATION                                                              |
|  API Key:     [E16mWmFtNNxA8afoLLu92QvT/qFfyQNRP+WbOWjvp5s=                      ]      |
|  Private Key: [-----BEGIN EC PRIVATE KEY----- ...                                 ]     |
|                                                                                         |
|  [Radio] CONNECTION                                      <-- RENAMED & MERGED CARD      |
|  +-----------------------------------------------------------------------------------+  |
|  | [X] Enable WebSocket Ping Heartbeat                                               |  |
|  |     Ping Interval (seconds): [30  ]                                               |  |
|  | [X] Auto-Reconnect on Unexpected Disconnection                                   |  |
|  |     Max Reconnect Delay (seconds): [30  ]   Max Attempts (0 for infinite): [0   ] |  |
|  +-----------------------------------------------------------------------------------+  |
|  | TLS Mode: ( ) None (Plain WS)   ( ) One-way TLS   (*) Mutual TLS (mTLS)           |  |
|  | Server CA Cert Path: [D:\...\rootCA.pem                               ] [Browse]  |  |
|  | Client Cert Path:    [                                                 ] [Browse]  |  |
|  | Client Key Path:     [                                                 ] [Browse]  |  |
|  | [ ] Skip TLS Certificate Verification                                             |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|  [Sparkles] SOFTWARE UPDATES                                                            |
|  [X] Automatically check for updates on startup                                         |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
| v2.3.0  [Check for Updates]                                              [Save Changes] |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Code Structure & Architecture Modernization

### 4.1 Backend: Clean Encapsulation in `internal/`
Instead of flat `app_xxx.go` files in `package main`:
- Keep `internal/websocket`:
  - Encapsulate ping/pong heartbeat and auto-reconnect logic directly inside `websocket.Client`.
  - Expose configuration methods: `SetHeartbeat(interval time.Duration)` and `SetAutoReconnect(...)`.
- `app.go`:
  - Remains the single, clean Wails application facade (~200 lines).
  - Delegates directly to `internal/` domain packages.

---

### 4.2 Frontend: Decoupled React Hooks Breakdown

Currently, [`App.tsx`](file:///D:/WorkProjects/pos-simulator-ecr-websocket/frontend/src/App.tsx) has 473 lines with 15+ state hooks and interleaved event listeners. We will extract 5 modular hooks under `frontend/src/hooks/`:

#### 1. `useWebSocket.ts`
- **Current in `App.tsx`**:
  Lines 49-56, 106-117, 138-180, 205-246 (`connected`, `activeHostPort`, `environments`, `handleConnect`, `handleDisconnect`, `handleEnvironmentChange`, `connection:status` listener).
- **When Updated**:
  ```tsx
  export function useWebSocket(config: config.Config, onLog: (type: LogType, msg: string) => void) {
    // manages connection state, host:port label, environment selection, event listeners
    return { connected, activeHostPort, environments, activeEnvId, connect, disconnect, switchEnvironment };
  }

  // Used in App.tsx:
  const { connected, activeHostPort, environments, activeEnvId, connect, disconnect, switchEnvironment } =
    useWebSocket(appConfig, addLog);
  ```

#### 2. `useDevices.ts`
- **Current in `App.tsx`**:
  Lines 57, 87-97, 182-185, 249-278 (`devices`, `refreshDevices`, `handlePairDevice`, `handleUnpairDevice`, `devices:updated` listener).
- **When Updated**:
  ```tsx
  export function useDevices(connected: boolean, onLog: (type: LogType, msg: string) => void) {
    return { devices, refreshDevices, pairDevice, unpairDevice };
  }

  // Used in App.tsx:
  const { devices, refreshDevices, pairDevice, unpairDevice } = useDevices(connected, addLog);
  ```

#### 3. `useTransactions.ts`
- **Current in `App.tsx`**:
  Lines 281-295 (`handleSendTransaction`), plus `transaction:response` event listener and toast handling.
- **When Updated**:
  ```tsx
  export function useTransactions(connected: boolean, onLog: (type: LogType, msg: string) => void) {
    // sends transaction, listens to "transaction:response" event, triggers rich toasts
    return { sendTransaction };
  }

  // Used in App.tsx:
  const { sendTransaction } = useTransactions(connected, addLog);
  ```

#### 4. `useLogs.ts`
- **Current in `App.tsx`**:
  Lines 58, 68-77, 187-199, 300 (`logs`, `addLog`, `handleClearLogs`, `log` event listener).
- **When Updated**:
  ```tsx
  export function useLogs() {
    return { logs, addLog, clearLogs };
  }

  // Used in App.tsx:
  const { logs, addLog, clearLogs } = useLogs();
  ```

#### 5. `useUpdater.ts`
- **Current in `App.tsx`**:
  Lines 61-66, 119-135, 201-203, 320-377 (`updateInfo`, `isUpdateDialogOpen`, `updateStage`, download/cancel/dismiss handlers, `update:progress` listener).
- **When Updated**:
  ```tsx
  export function useUpdater(config: config.Config, connected: boolean) {
    return {
      updateInfo,
      isDialogOpen,
      stage,
      progress,
      errorMessage,
      isChecking,
      openDialog,
      closeDialog,
      manualCheck,
      startDownload,
      cancelUpdate,
      dismissUpdate,
    };
  }

  // Used in App.tsx:
  const updater = useUpdater(appConfig, connected);
  ```

---

## 5. Execution Roadmap

```mermaid
flowchart TD
    Step1["Step 1: Backend WebSocket Heartbeat, Auto-Reconnect & Config<br/>- Add Connection config in internal/config<br/>- Add Ping/Pong & backoff in internal/websocket (debug slog only)<br/>- Emit transaction:response in app.go"]
    Step2["Step 2: Settings UI & LogConsole Search<br/>- Merge into 'Connection' card in SettingView<br/>- Add right-aligned instant search input to LogConsole"]
    Step3["Step 3: Frontend Hooks Extraction & Toasts<br/>- Extract useWebSocket, useDevices, useTransactions, useLogs, useUpdater<br/>- Refactor App.tsx to use hooks<br/>- Implement transaction response toasts"]
    Step4["Step 4: Quality Assurance & Unit Tests (LAST)<br/>- Add tests for websocket ping/pong & reconnect<br/>- Add tests for protocol signing & ecr payloads<br/>- Verify build & tests"]

    Step1 --> Step2 --> Step3 --> Step4
```
