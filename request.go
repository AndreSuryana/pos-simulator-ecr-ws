package main

import "pos-simulator-ecr-ws/internal/ecr"

// PairRequest is the UI request for pairing an EDC device.
type PairRequest struct {
	EDCID    string `json:"edcId"`
	PairCode string `json:"pairCode"`
}

// UnpairRequest is the UI request for unpairing an EDC device.
type UnpairRequest struct {
	EDCID string `json:"edcId"`
}

// SendTransactionRequest is the UI request for sending a transaction.
type SendTransactionRequest struct {
	EDCID           string              `json:"edcId"`
	TransactionType ecr.TransactionType `json:"transactionType"`
	DataField       ecr.DataField       `json:"dataField"`
}
