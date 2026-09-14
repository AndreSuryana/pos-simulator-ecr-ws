package ecr

type FieldType string

const (
	FieldTypeText   FieldType = "text"
	FieldTypeNumber FieldType = "number"
	FieldTypeSelect FieldType = "select"
)

// FieldKey identifies a field and doubles as the data field map key.
type FieldKey string

type FieldOption struct {
	Label string
	Value string
}

// Field describes a single input: identity, UI hints, and constraints.
type Field struct {
	Key         FieldKey
	Label       string
	Type        FieldType
	Placeholder string
	Options     []FieldOption
	Default     string
}

var (
	Amount    = Field{Key: "amount", Label: "Amount", Type: FieldTypeNumber, Placeholder: "0", Default: "0"}
	TipAmount = Field{Key: "tipAmount", Label: "Tip Amount", Type: FieldTypeNumber, Placeholder: "0", Default: "0"}

	Tenor = Field{
		Key: "tenor", Label: "Tenor", Type: FieldTypeSelect, Default: "3",
		Options: []FieldOption{
			{"3 Months", "3"},
			{"6 Months", "6"},
			{"9 Months", "9"},
			{"12 Months", "12"},
			{"18 Months", "18"},
			{"24 Months", "24"},
		},
	}

	Plan = Field{
		Key: "plan", Label: "Plan", Type: FieldTypeSelect, Default: "None",
		Options: []FieldOption{
			{"None", "None"},
			{"Plan 1", "1"},
			{"Plan 2", "2"},
			{"Plan 3", "3"},
		},
	}

	TraceNumber   = Field{Key: "traceNumber", Label: "Trace Number", Type: FieldTypeText, Placeholder: "e.g. 000001"}
	InvoiceNumber = Field{Key: "invoiceNumber", Label: "Invoice Number", Type: FieldTypeText, Placeholder: "e.g. INV-10293"}
	TransactionID = Field{Key: "transactionId", Label: "Transaction ID", Type: FieldTypeText, Placeholder: "Enter Transaction ID"}
)
