package edc

import "errors"

// Device represents a paired EDC.
type Device struct {
	ID string `json:"edc_id"`
}

// Validate validates the device.
func (d Device) Validate() error {
	if d.ID == "" {
		return errors.New("missing required EDC ID")
	}

	return nil
}

// ListRequest is the GET_LIST_EDC payload.
type ListRequest struct {
	POSID string `json:"pos_id"`
}

// Validate validates the list request.
func (r ListRequest) Validate() error {
	if r.POSID == "" {
		return errors.New("missing required POS ID")
	}

	return nil
}

// ListResponse is the LIST_EDC payload.
type ListResponse struct {
	POSID   string   `json:"pos_id"`
	Devices []Device `json:"data_list"`
}

// PairRequest is the PAIR_POS payload.
type PairRequest struct {
	EDCID    string `json:"edc_id"`
	PairCode string `json:"pair_code"`
}

// Validate validates the pair request.
func (r PairRequest) Validate() error {
	if r.EDCID == "" {
		return errors.New("missing required EDC ID")
	}

	if r.PairCode == "" {
		return errors.New("missing required pair code")
	}

	return nil
}

// PairResponse is the PAIR_POS_DONE payload.
type PairResponse struct {
	POSID string `json:"pos_id"`
	EDCID string `json:"edc_id"`
}

// UnpairRequest is the UNPAIR_EDC payload.
type UnpairRequest struct {
	EDCID string `json:"edc_id"`
}

// Validate validates the unpair request.
func (r UnpairRequest) Validate() error {
	if r.EDCID == "" {
		return errors.New("missing required EDC ID")
	}

	return nil
}

// UnpairResponse is the UNPAIR_EDC_DONE payload.
type UnpairResponse struct {
	EDCID  string `json:"edc_id"`
	Status string `json:"status"`
}

const (
	StatusSuccessUnpair = "success unpair"
)

// IsSuccessful indicates successful unpairing.
func (r UnpairResponse) IsSuccessful() bool {
	return r.Status == StatusSuccessUnpair
}
