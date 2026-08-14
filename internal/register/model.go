package register

import "errors"

// Request is the REGISTER_POS payload.
type Request struct {
	POSID string `json:"pos_id"`
	MID   string `json:"mid"`
}

// Validate mirrors Python's RegisterDevice.validate().
func (r Request) Validate() error {
	if r.POSID == "" {
		return errors.New("missing required POS ID")
	}
	if r.MID == "" {
		return errors.New("missing required MID")
	}
	return nil
}

// Response is the REGISTER_POS_DONE payload.
type Response struct {
	POSID  string `json:"pos_id"`
	MID    string `json:"mid"`
	Status string `json:"status"`
}

const (
	StatusRegistered = "registered"
)

// IsRegistered indicates successful registration.
func (r Response) IsRegistered() bool {
	return r.Status == StatusRegistered
}
