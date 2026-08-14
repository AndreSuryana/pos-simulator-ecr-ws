package protocol

import (
	"encoding/json"
	"fmt"
)

// Parse parses a raw JSON protocol message into a typed Message.
//
// Example:
//
//	var message Message[pairing.PairResponse]
//	err := protocol.Parse(data, &message)
func Parse[T any](data []byte, message *Message[T]) error {
	if err := json.Unmarshal(data, message); err != nil {
		return fmt.Errorf("parse protocol message: %w", err)
	}

	return nil
}
