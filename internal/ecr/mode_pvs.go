package ecr

var ModePVS = Mode{
	ID:    "pvs",
	Label: "PVS",
	TransactionTypes: []TransactionType{
		{ID: "saleRegular", Label: "Sale (Regular)", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "saleInstallment", Label: "Sale (Installment)", Fields: []Field{Amount, Tenor, Plan, TransactionID}},
		{ID: "edcPayment", Label: "Sale (Select Payment Method)", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "voidRegular", Label: "Void (Regular)", Fields: []Field{TraceNumber, TransactionID}},
		{ID: "settlement", Label: "Settlement", Fields: []Field{}},

		// Report
		{ID: "summaryReport", Label: "Summary Report", Fields: []Field{}},

		// QR Generating Methods
		{ID: "qrisAll", Label: "QRIS (All)", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisBni", Label: "QRIS BNI", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisBri", Label: "QRIS BRI", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisBsi", Label: "QRIS BSI", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisBtn", Label: "QRIS BTN", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisCimb", Label: "QRIS CIMB", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisPermata", Label: "QRIS PERMATA", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrAtome", Label: "Atome", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrKredivo", Label: "Kredivo", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisIndodana", Label: "Indodana", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisGaja", Label: "QRIS GAJA", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisGopay", Label: "QRIS GOPAY", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisPvs", Label: "QRIS PVS", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisOvo", Label: "QRIS OVO", Fields: []Field{Amount, TipAmount, TransactionID}},
		{ID: "qrisShopeePay", Label: "QRIS ShopeePay", Fields: []Field{Amount, TipAmount, TransactionID}},

		// QR Check Status Methods
		{ID: "edcCheckStatus", Label: "Check Status QR (All)", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusBca", Label: "Check Status QRIS BCA", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusBni", Label: "Check Status QRIS BNI", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusBri", Label: "Check Status QRIS BRI", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusBsi", Label: "Check Status QRIS BSI", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusBtn", Label: "Check Status QRIS BTN", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusCimb", Label: "Check Status QRIS CIMB", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusSmbc", Label: "Check Status QRIS SMBC", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusAtome", Label: "Check Status QR Atome", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusDoku", Label: "Check Status QRIS Doku", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusGaja", Label: "Check Status QRIS Gaja", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusGopay", Label: "Check Status QRIS Gopay", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusIndodana", Label: "Check Status QR Indodana", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusKredivo", Label: "Check Status QR Kredivo", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusOvo", Label: "Check Status QRIS OVO", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusPvs", Label: "Check Status QRIS PVS", Fields: []Field{Amount, TransactionID}},
		{ID: "checkStatusShopeePay", Label: "Check Status QRIS ShopeePay", Fields: []Field{Amount, TransactionID}},

		// ECR and System Checks
		{ID: "getLastEcrTransaction", Label: "Get Last ECR Transaction", Fields: []Field{TransactionID}},
		{ID: "getAnyEcrTransaction", Label: "Get Any ECR Transaction", Fields: []Field{TransactionID}},
		{ID: "echoTest", Label: "Echo Test", Fields: []Field{}},
		{ID: "checkConnection", Label: "Check Connection", Fields: []Field{}},
		{ID: "checkVersion", Label: "Check Version", Fields: []Field{}},
	},
}
