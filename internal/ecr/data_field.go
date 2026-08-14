package ecr

// Field identifies an ECR transaction field.
type Field string

const (
	FieldAmount           Field = "amount"
	FieldTipAmount        Field = "tipAmount"
	FieldInstallmentTenor Field = "tenor"
	FieldInstallmentPlan  Field = "plan"
	FieldTransactionID    Field = "transactionId"
	FieldTraceNumber      Field = "traceNumber"
	FieldInvoiceNumber    Field = "invoiceNumber"
)

// DataField contains the values for an ECR transaction.
//
// Only non-empty fields are serialized into the protocol payload.
type DataField struct {
	Amount        string `json:"amount,omitempty"`
	TipAmount     string `json:"tipAmount,omitempty"`
	Tenor         string `json:"tenor,omitempty"`
	Plan          string `json:"plan,omitempty"`
	TransactionID string `json:"transactionId,omitempty"`
	TraceNumber   string `json:"traceNumber,omitempty"`
	InvoiceNumber string `json:"invoiceNumber,omitempty"`
}
