package protocol

import (
	"fmt"

	"github.com/google/uuid"
)

// Client holds long-lived request-signing credentials (API key + private
// key) and builds signed protocol envelopes on demand.
//
// This is the Go equivalent of Python's SignedPayload: callers construct
// one Client after the API key / private key are known (e.g. once Settings
// are validated) and reuse it for every outbound message, instead of
// threading credentials through each call site.
type Client struct {
	apiKey string
	signer *Signer
}

// NewClient creates a Client from an API key and a PEM-encoded EC private
// key. Returns an error if the private key is missing or malformed.
func NewClient(apiKey, privateKeyPEM string) (*Client, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("api key must not be empty")
	}

	signer, err := NewSigner(privateKeyPEM)
	if err != nil {
		return nil, fmt.Errorf("create signer: %w", err)
	}

	return &Client{apiKey: apiKey, signer: signer}, nil
}

// Build creates a fully-populated, signed Message envelope for the given
// type and payload. A fresh UID is generated per call; the signature covers
// only Data (matching the Python implementation, which signs the "data"
// dict, not the full envelope).
//
// Build is a free function rather than a Client method because Go does not
// allow generic methods — the type parameter must live on the function.
func Build[T any](c *Client, msgType Type, data T) (Message[T], error) {
	signature, err := c.signer.Sign(data)
	if err != nil {
		return Message[T]{}, fmt.Errorf("sign payload: %w", err)
	}

	return Message[T]{
		UID:       uuid.NewString(),
		Type:      msgType,
		APIKey:    c.apiKey,
		Signature: signature,
		Data:      data,
	}, nil
}
