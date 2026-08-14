package ecr

var ModeBRI = Mode{
	ID:    "bri",
	Label: "BRI",
	TransactionTypes: []TransactionType{
		{ID: "saleRegular", Label: "Sale (Regular)", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "saleInstallment", Label: "Sale Installment", Fields: []Field{FieldAmount, FieldInstallmentTenor, FieldInstallmentPlan, FieldTransactionID}},

		{ID: "qrisBri", Label: "QRIS BRI", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisTap", Label: "QRIS Tap", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "checkStatusQR", Label: "Check QR Status", Fields: []Field{FieldInvoiceNumber, FieldTransactionID}},
		{ID: "qrisRefund", Label: "Refund QR", Fields: []Field{FieldInvoiceNumber, FieldTransactionID}},

		{ID: "voidRegular", Label: "Void (Regular)", Fields: []Field{FieldTraceNumber, FieldTransactionID}},
		{ID: "settlement", Label: "Settlement", Fields: []Field{}},

		{ID: "getLastEcrTransaction", Label: "Get Last ECR Transaction", Fields: []Field{FieldTransactionID}},
		{ID: "getAnyEcrTransaction", Label: "Get Any ECR Transaction", Fields: []Field{FieldTransactionID}},

		{ID: "echoTest", Label: "Echo Test", Fields: []Field{}},
		{ID: "checkConnection", Label: "Check Connection", Fields: []Field{}},
		{ID: "checkVersion", Label: "Check Version", Fields: []Field{}},
	},
}
