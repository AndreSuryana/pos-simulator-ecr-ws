package main

import (
	"context"
	"encoding/json"
	"fmt"

	"pos-simulator-ecr-ws/internal/config"
	"pos-simulator-ecr-ws/internal/edc"
	"pos-simulator-ecr-ws/internal/logger"
	"pos-simulator-ecr-ws/internal/protocol"
	"pos-simulator-ecr-ws/internal/register"
	"pos-simulator-ecr-ws/internal/transaction"
	"pos-simulator-ecr-ws/internal/websocket"
)

// App is the Wails application.
type App struct {
	ctx context.Context

	config *config.Manager
	logger *logger.Logger

	websocket *websocket.Client

	protocol *protocol.Client

	register    *register.Register
	devices     *edc.Devices
	transaction *transaction.Transaction
}

// NewApp creates a new application.
func NewApp() (*App, error) {
	cfg, err := config.New()
	if err != nil {
		return nil, err
	}

	app := &App{
		config:    cfg,
		logger:    logger.New(),
		websocket: websocket.New(),
	}

	app.websocket.OnConnect = app.onConnect
	app.websocket.OnDisconnect = app.onDisconnect
	app.websocket.OnMessage = app.onMessage

	return app, nil
}

// startup is called when the application starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.logger.SetContext(ctx)
}

// shutdown is called before the application exits.
func (a *App) shutdown(ctx context.Context) {
	if err := a.Disconnect(); err != nil {
		a.logger.Error("Disconnect", err)
	}
}

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

// Config returns the current application configuration.
func (a *App) Config() config.Config {
	return a.config.Config()
}

// UpdateConfig updates the application configuration.
//
// Changes are automatically persisted by the configuration manager.
func (a *App) UpdateConfig(cfg config.Config) error {
	a.config.Update(func(current *config.Config) {
		*current = cfg
	})

	return nil
}

// ----------------------------------------------------------------------------
// Connection
// ----------------------------------------------------------------------------

// Connect connects to the configured WebSocket server.
func (a *App) Connect() error {
	cfg := a.config.Config()

	tlsConfig, err := websocket.LoadTLSConfig(
		cfg.ClientCertPath,
		cfg.ClientKeyPath,
		cfg.ServerCACertPath,
		cfg.SkipTLSVerify,
	)
	if err != nil {
		return err
	}

	client, err := protocol.NewClient(
		cfg.APIKey,
		cfg.PrivateKey,
	)
	if err != nil {
		return err
	}

	a.protocol = client
	a.register = register.New(client, cfg.POSID, cfg.MID)
	a.devices = edc.New(client, cfg.POSID)
	a.transaction = transaction.New(client)

	return a.websocket.Connect(
		a.ctx,
		cfg.ServerURL,
		tlsConfig,
	)
}

// Disconnect disconnects from the WebSocket server.
func (a *App) Disconnect() error {
	return a.websocket.Disconnect()
}

// Connected reports whether the simulator is connected.
func (a *App) Connected() bool {
	return a.websocket.Connected()
}

// ----------------------------------------------------------------------------
// Devices
// ----------------------------------------------------------------------------

// Devices returns the currently paired EDC devices.
func (a *App) Devices() []edc.Device {
	if a.devices == nil {
		return nil
	}

	return a.devices.All()
}

// Pair pairs an EDC device.
func (a *App) Pair(request PairRequest) error {
	message, err := a.devices.Pair(
		request.EDCID,
		request.PairCode,
	)
	if err != nil {
		return err
	}

	return a.send(message)
}

// Unpair unpairs an EDC device.
func (a *App) Unpair(request UnpairRequest) error {
	message, err := a.devices.Unpair(
		request.EDCID,
	)
	if err != nil {
		return err
	}

	return a.send(message)
}

// ----------------------------------------------------------------------------
// Transaction
// ----------------------------------------------------------------------------

// SendTransaction sends a transaction request to an EDC.
func (a *App) SendTransaction(request SendTransactionRequest) error {
	message, err := a.transaction.Send(
		request.EDCID,
		request.TransactionType,
		request.DataField,
	)
	if err != nil {
		return err
	}

	return a.send(message)
}

// ----------------------------------------------------------------------------
// WebSocket callbacks
// ----------------------------------------------------------------------------

// onConnect is called after the WebSocket connection has been established.
func (a *App) onConnect() {
	a.logger.Info("WebSocket connected")

	message, err := a.register.Register()
	if err != nil {
		a.logger.Error("Build registration request", err)
		return
	}

	if err := a.send(message); err != nil {
		a.logger.Error("Send registration request", err)
	}
}

// onDisconnect is called when the WebSocket connection is closed.
func (a *App) onDisconnect(err error) {
	a.register.Reset()
	a.devices.Reset()

	if err != nil {
		a.logger.Error("WebSocket disconnected", err)
		return
	}

	a.logger.Info("WebSocket disconnected")
}

// onMessage is called for every incoming WebSocket message.
func (a *App) onMessage(data []byte) {
	a.logger.Debug("← " + string(data))

	msgType, err := protocol.MessageType(data)
	if err != nil {
		a.logger.Error("Parse protocol type", err)
		return
	}

	switch msgType {
	case protocol.TypeRegisterPOSDone:
		err = a.handleRegister(data)

	case protocol.TypeListEDC:
		err = a.handleDeviceList(data)

	case protocol.TypePairPOSDone:
		err = a.handlePair(data)

	case protocol.TypeUnpairEDCDone:
		err = a.handleUnpair(data)

	case protocol.TypeSendToPOS:
		err = a.handleTransaction(data)

	default:
		a.logger.Warn("Unhandled protocol message", "type", msgType)
		return
	}

	if err != nil {
		a.logger.Error("Handle protocol message", err)
	}
}

// ----------------------------------------------------------------------------
// Protocol
// ----------------------------------------------------------------------------

// send marshals and sends a protocol message.
func (a *App) send(message any) error {
	data, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("marshal protocol message: %w", err)
	}

	a.logger.Debug("→ " + string(data))

	if err := a.websocket.Send(data); err != nil {
		return err
	}

	return nil
}

// ----------------------------------------------------------------------------
// Protocol routing
// ----------------------------------------------------------------------------

// handleRegister handles a REGISTER_POS_DONE message.
func (a *App) handleRegister(data []byte) error {
	if err := a.register.Handle(data); err != nil {
		return err
	}

	message, err := a.devices.List()
	if err != nil {
		return err
	}

	return a.send(message)
}

// handleDeviceList handles a LIST_EDC message.
func (a *App) handleDeviceList(data []byte) error {
	return a.devices.HandleList(data)
}

// handlePair handles a PAIR_POS_DONE message.
func (a *App) handlePair(data []byte) error {
	return a.devices.HandlePair(data)
}

// handleUnpair handles an UNPAIR_EDC_DONE message.
func (a *App) handleUnpair(data []byte) error {
	return a.devices.HandleUnpair(data)
}

// handleTransaction handles a SEND_TO_POS message.
func (a *App) handleTransaction(data []byte) error {
	response, err := a.transaction.Handle(data)
	if err != nil {
		return err
	}

	if response.Approved() {
		a.logger.Info("Transaction approved")
	} else {
		a.logger.Warn(
			"Transaction failed",
			"code", response.DataTransaction.ResponseCode,
			"message", response.DataTransaction.ResponseMessage,
		)
	}

	return nil
}
