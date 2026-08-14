package transaction

import (
	"errors"

	"pos-simulator-ecr-ws/internal/ecr"
)

// Request is the SEND_TO_EDC payload.
type Request struct {
	EDCID           string          `json:"edc_id"`
	DataTransaction DataTransaction `json:"data_transaction"`
}

// Validate validates the transaction request.
func (r Request) Validate() error {
	if r.EDCID == "" {
		return errors.New("missing required EDC ID")
	}

	return r.DataTransaction.Validate()
}

// DataTransaction contains the transaction request.
type DataTransaction struct {
	TransactionType string        `json:"transactionType"`
	DataField       ecr.DataField `json:"dataField"`
}

// Validate validates the transaction payload.
func (t DataTransaction) Validate() error {
	if t.TransactionType == "" {
		return errors.New("missing required transaction type")
	}

	return nil
}

// Response is the SEND_TO_POS payload.
type Response struct {
	EDCID           string                  `json:"edc_id"`
	DataTransaction ResponseDataTransaction `json:"data_transaction"`
}

const (
	ResponseCodeApproved = "00"
)

// Approved reports whether the transaction succeeded.
func (r Response) Approved() bool {
	return r.DataTransaction.ResponseCode == ResponseCodeApproved
}

// ResponseDataTransaction contains the transaction response.
type ResponseDataTransaction struct {
	ResponseCode    string            `json:"responseCode"`
	ResponseMessage string            `json:"responseMessage"`
	TransactionType string            `json:"transactionType"`
	DataField       map[string]string `json:"dataField"`
}
