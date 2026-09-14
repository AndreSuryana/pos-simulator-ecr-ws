package ecr

var reffNoBRI = Field{Key: "reffNoBRI", Label: "Reff No.", Type: FieldTypeText, Placeholder: "e.g. 202312345678"}

var ModeBRI = Mode{
	ID:    "bri",
	Label: "BRI",
	TransactionTypes: []TransactionType{
		{ID: "saleRegular", Label: "Sale (Regular)", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "saleInstallment", Label: "Sale Installment", Fields: []Field{Amount, Tenor, Plan, TransactionID}},

		{ID: "qrisBri", Label: "QRIS BRI", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisTap", Label: "QRIS Tap", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "checkStatusQR", Label: "Check QR Status", Fields: []Field{reffNoBRI, TransactionID}},
		{ID: "qrisRefund", Label: "Refund QR", Fields: []Field{InvoiceNumber, TransactionID}},

		{ID: "voidRegular", Label: "Void (Regular)", Fields: []Field{TraceNumber, TransactionID}},
		{ID: "settlement", Label: "Settlement", Fields: []Field{}},

		{ID: "getLastEcrTransaction", Label: "Get Last ECR Transaction", Fields: []Field{TransactionID}},
		{ID: "getAnyEcrTransaction", Label: "Get Any ECR Transaction", Fields: []Field{TransactionID}},

		{ID: "echoTest", Label: "Echo Test", Fields: []Field{}},
		{ID: "checkConnection", Label: "Check Connection", Fields: []Field{}},
		{ID: "checkVersion", Label: "Check Version", Fields: []Field{}},
	},
}
