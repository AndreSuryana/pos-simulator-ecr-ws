package protocol

// Message represents an ECR protocol message.
//
// All requests and responses exchanged with the ECR server use the same
// envelope format. The payload is represented by the generic type parameter.
type Message[T any] struct {
	UID       string `json:"uid"`
	Type      Type   `json:"type"`
	APIKey    string `json:"api_key,omitempty"`
	Signature string `json:"signature,omitempty"`
	Data      T      `json:"data"`
}
