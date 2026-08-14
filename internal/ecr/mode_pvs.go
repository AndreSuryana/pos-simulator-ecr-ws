package ecr

var ModePVS = Mode{
	ID:    "pvs",
	Label: "PVS",
	TransactionTypes: []TransactionType{
		{ID: "saleRegular", Label: "Sale (Regular)", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "saleInstallment", Label: "Sale (Installment)", Fields: []Field{FieldAmount, FieldInstallmentTenor, FieldInstallmentPlan, FieldTransactionID}},
		{ID: "edcPayment", Label: "Sale (Select Payment Method)", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "voidRegular", Label: "Void (Regular)", Fields: []Field{FieldTraceNumber, FieldTransactionID}},
		{ID: "settlement", Label: "Settlement", Fields: []Field{}},

		// QR Generating Methods
		{ID: "qrisAll", Label: "QRIS (All)", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisBni", Label: "QRIS BNI", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisBri", Label: "QRIS BRI", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisBsi", Label: "QRIS BSI", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisBtn", Label: "QRIS BTN", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisCimb", Label: "QRIS CIMB", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisPermata", Label: "QRIS PERMATA", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrAtome", Label: "Atome", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrKredivo", Label: "Kredivo", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisIndodana", Label: "Indodana", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisGaja", Label: "QRIS GAJA", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisGopay", Label: "QRIS GOPAY", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisPvs", Label: "QRIS PVS", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisOvo", Label: "QRIS OVO", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},
		{ID: "qrisShopeePay", Label: "QRIS ShopeePay", Fields: []Field{FieldAmount, FieldTipAmount, FieldTransactionID}},

		// QR Check Status Methods
		{ID: "edcCheckStatus", Label: "Check Status QR (All)", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusBca", Label: "Check Status QRIS BCA", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusBni", Label: "Check Status QRIS BNI", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusBri", Label: "Check Status QRIS BRI", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusBsi", Label: "Check Status QRIS BSI", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusBtn", Label: "Check Status QRIS BTN", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusCimb", Label: "Check Status QRIS CIMB", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusSmbc", Label: "Check Status QRIS SMBC", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusAtome", Label: "Check Status QR Atome", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusDoku", Label: "Check Status QRIS Doku", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusGaja", Label: "Check Status QRIS Gaja", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusGopay", Label: "Check Status QRIS Gopay", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusIndodana", Label: "Check Status QR Indodana", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusKredivo", Label: "Check Status QR Kredivo", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusOvo", Label: "Check Status QRIS OVO", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusPvs", Label: "Check Status QRIS PVS", Fields: []Field{FieldAmount, FieldTransactionID}},
		{ID: "checkStatusShopeePay", Label: "Check Status QRIS ShopeePay", Fields: []Field{FieldAmount, FieldTransactionID}},

		// ECR and System Checks
		{ID: "getLastEcrTransaction", Label: "Get Last ECR Transaction", Fields: []Field{FieldTransactionID}},
		{ID: "getAnyEcrTransaction", Label: "Get Any ECR Transaction", Fields: []Field{FieldTransactionID}},
		{ID: "echoTest", Label: "Echo Test", Fields: []Field{}},
		{ID: "checkConnection", Label: "Check Connection", Fields: []Field{}},
		{ID: "checkVersion", Label: "Check Version", Fields: []Field{}},
	},
}
