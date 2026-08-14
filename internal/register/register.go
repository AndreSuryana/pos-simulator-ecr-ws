package register

import (
	"fmt"

	"pos-simulator-ecr-ws/internal/protocol"
)

// Register manages the POS registration lifecycle.
type Register struct {
	protocol *protocol.Client

	request Request

	registered bool
}

// New creates a new Register.
func New(
	protocol *protocol.Client,
	posID string,
	mid string,
) (*Register, error) {
	request := Request{
		POSID: posID,
		MID:   mid,
	}

	if err := request.Validate(); err != nil {
		return nil, err
	}

	return &Register{
		protocol: protocol,
		request:  request,
	}, nil
}

// Register builds a REGISTER_POS request.
func (r *Register) Register() (protocol.Message[Request], error) {
	return protocol.Build(
		r.protocol,
		protocol.TypeRegisterPOS,
		r.request,
	)
}

// Handle handles a REGISTER_POS_DONE response.
func (r *Register) Handle(data []byte) error {
	var message protocol.Message[Response]

	if err := protocol.Parse(data, &message); err != nil {
		return err
	}

	if !message.Data.IsRegistered() {
		return fmt.Errorf("registration failed: %s", message.Data.Status)
	}

	r.registered = true

	return nil
}

// Registered reports whether the POS has been successfully registered.
func (r *Register) Registered() bool {
	return r.registered
}

// Reset clears the registration state.
//
// Call this when the WebSocket connection is lost. The next successful
// connection should perform registration again.
func (r *Register) Reset() {
	r.registered = false
}
