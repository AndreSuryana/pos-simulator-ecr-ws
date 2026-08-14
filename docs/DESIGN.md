# POS ECR WebSocket Simulator

## Go Backend Architecture Decisions

> Last updated: 2026-08-05

---

# Goals

## Primary Goal

Rewrite the existing Python + Qt6 implementation into a modern desktop application using:

- Wails v2
- Go
- React
- TypeScript

while preserving the existing protocol and functionality.

## Non-goals

- Building a reusable framework/library
- Supporting transports other than WebSocket
- Introducing unnecessary enterprise patterns

The application is a **desktop POS Simulator** that communicates using the **ECR WebSocket protocol**.

---

# Design Principles

## Keep it simple

Prefer simple and readable code over clever abstractions.

## Thin App layer

`App` exists only as the Wails binding layer.

It delegates immediately to the corresponding feature package.

It contains **no business logic**.

## Feature-oriented packages

Packages should represent responsibilities, not technologies.

Avoid generic packages like:

- utils
- helpers
- common
- services

Every package should have a clear owner.

## Concrete types first

Do **not** introduce interfaces until they are actually needed.

Follow Go idioms.

## Package ownership

Each package owns its own runtime state.

Avoid a global application state/session object.

---

# High-Level Architecture

```
React
    │
    ▼
Wails App
    │
    ▼
Go Backend
```

The frontend communicates **only** with the Wails App.

The frontend never accesses:

- WebSocket
- Protocol
- Signing
- Configuration persistence

directly.

---

# App

## Responsibilities

- Hold root dependencies.
- Expose Wails methods.
- Delegate requests.

## Must NOT

- Coordinate business logic.
- Build protocol messages.
- Send WebSocket messages directly.
- Parse protocol messages.

Example:

```go
func (a *App) Pair(req pairing.Request) error {
    return a.pairing.Pair(req)
}
```

---

# Package Structure

```text
internal/
├── config/
│   ├── config.go
│   └── manager.go
│
├── protocol/
│   ├── envelope.go
│   ├── parser.go
│   ├── signer.go
│   └── types.go
│
├── websocket/
│   ├── client.go
│   ├── events.go
│   ├── handlers.go
│   └── tls.go
│
├── pairing/
│   ├── pairing.go
│   ├── handler.go
│   ├── request.go
│   └── response.go
│
├── transaction/
│   ├── transaction.go
│   ├── handler.go
│   ├── request.go
│   └── response.go
│
├── ecr/
│   ├── mode.go
│   ├── transaction_type.go
│   ├── transaction_definition.go
│   ├── data_field.go
│
├── logger/
│   └── logger.go
│
└── model/
```

---

# Package Responsibilities

## config

Owns:

- configuration model
- loading
- saving
- debounced persistence

Configuration is automatically saved.

There is **no Save button**.

---

## protocol

Owns:

- message envelope
- parser
- payload builder
- ECDSA signing

Protocol understands how the ECR protocol is built.

It does **not** know anything about UI.

---

## websocket

Owns:

- websocket connection
- TLS configuration
- send
- receive
- reconnect
- connection state

The transport is always WebSocket.

No abstraction layer is required.

---

## pairing

Owns:

- Register
- Pair
- Unpair
- paired device state
- handling pairing responses

Pairing communicates directly with:

- protocol
- websocket
- logger

---

## transaction

Owns:

- Send transaction
- runtime transaction state
- handling transaction responses

Transaction communicates directly with:

- ecr
- protocol
- websocket
- logger

---

## ecr

Owns all ECR-specific domain models.

Including:

- transaction types
- field visibility
- transaction metadata
- DataField
- request/response models

---

## logger

Centralized logging.

Every package logs through this package.

Logger is responsible for emitting log events to Wails.

---

# Dependency Direction

```
App
│
├── Config
├── Logger
├── Protocol
├── WebSocket
├── Pairing
└── Transaction
```

Feature dependencies:

```
Pairing
    │
    ├── Protocol
    ├── WebSocket
    └── Logger

Transaction
    │
    ├── ECR
    ├── Protocol
    ├── WebSocket
    └── Logger
```

WebSocket never imports feature packages.

---

# Runtime State

Every package owns its own runtime state.

Example:

Config

- configuration

WebSocket

- connection
- connected status

Pairing

- paired devices
- selected device

Transaction

- runtime transaction information

No global Session object.

---

# Protocol Design

## Envelope

Strongly typed.

Example:

```go
type Message[T any] struct {
    UID       string `json:"uid"`
    Type      Type   `json:"type"`
    APIKey    string `json:"api_key"`
    Signature string `json:"signature,omitempty"`
    Data       T      `json:"data"`
}
```

---

## Request/Response

Strongly typed.

Examples:

- RegisterRequest
- RegisterResponse
- PairRequest
- PairResponse
- UnpairRequest
- UnpairResponse
- SendTransactionRequest

---

# DataField

Decision:

Use one struct instead of a map.

Reason:

- better autocomplete
- compile-time checking
- easier refactoring
- easier validation

Example:

```go
type DataField struct {
    Amount        string `json:"amount,omitempty"`
    TipAmount     string `json:"tipAmount,omitempty"`
    Invoice       string `json:"invoice,omitempty"`
    TraceNo       string `json:"traceNo,omitempty"`
    TransactionID string `json:"transactionId,omitempty"`
    Tenor         string `json:"tenor,omitempty"`
    Plan          string `json:"plan,omitempty"`

    // Additional ECR fields...
}
```

---

# Incoming Message Flow

```
WebSocket Receive
        │
        ▼
Protocol.Parse()
        │
        ▼
Typed Message
        │
        ▼
Pairing / Transaction
```

WebSocket does not understand protocol messages.

---

# Logging

One Logger instance.

Injected into every package.

```
Package

↓

Logger

↓

Wails Events

↓

React
```

---

# Configuration

Configuration is updated immediately.

Changes are persisted automatically using debounce.

WebSocket receives configuration from callers.

It never loads configuration itself.

---

# Wails Events

Specific events are used.

Examples:

- ws:connected
- ws:disconnected
- pairing:completed
- pairing:failed
- transaction:received
- transaction:completed
- log

---

# Constructors

Every package exposes a constructor.

Example:

```go
pairing.New(
    websocket,
    protocol,
    logger,
)
```

Dependencies should always be explicit.

---

# Interfaces

Decision:

Do **not** introduce interfaces initially.

Use concrete implementations.

Create interfaces only when there is a real consumer requiring one.

---

# Implementation Strategy

Packages will be implemented one at a time.

Order:

1. config
2. logger
3. protocol
4. ecr
5. websocket
6. pairing
7. transaction
8. app
9. frontend

Each package should be:

- complete
- reviewed
- considered finished

before moving to the next package.

---

# General Rules

- No business logic inside App.
- No utils package.
- No common package.
- No helper package.
- No service package.
- No dependency injection framework.
- No Repository pattern.
- No Factory pattern.
- No Command pattern.
- Keep APIs small.
- Keep exported symbols minimal.
- Keep responsibilities clear.
- Prefer readability over abstraction.
