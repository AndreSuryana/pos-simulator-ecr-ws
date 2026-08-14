package transaction

import (
	"pos-simulator-ecr-ws/internal/ecr"
	"pos-simulator-ecr-ws/internal/protocol"
)

// Transaction manages ECR transaction requests.
type Transaction struct {
	protocol *protocol.Client
}

// New creates a new Transaction.
func New(
	protocol *protocol.Client,
) *Transaction {
	return &Transaction{
		protocol: protocol,
	}
}

// Send builds a SEND_TO_EDC request.
func (t *Transaction) Send(
	edcID string,
	transactionType ecr.TransactionType,
	dataField ecr.DataField,
) (protocol.Message[Request], error) {
	request := Request{
		EDCID: edcID,
		DataTransaction: DataTransaction{
			TransactionType: transactionType.ID,
			DataField:       dataField,
		},
	}

	if err := request.Validate(); err != nil {
		return protocol.Message[Request]{}, err
	}

	return protocol.Build(
		t.protocol,
		protocol.TypeSendToEDC,
		request,
	)
}

// Handle handles a SEND_TO_POS response.
func (t *Transaction) Handle(data []byte) (*Response, error) {
	var message protocol.Message[Response]

	if err := protocol.Parse(data, &message); err != nil {
		return nil, err
	}

	return &message.Data, nil
}
