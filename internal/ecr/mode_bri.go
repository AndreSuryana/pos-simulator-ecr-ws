package ecr

var ModeBRI = Mode{
	ID:    "bri",
	Label: "BRI",
	TransactionTypes: []TransactionType{
		{
			ID:    "saleRegular",
			Label: "Sale",
			Fields: []Field{
				FieldAmount,
				FieldTipAmount,
				FieldTransactionID,
			},
		},
		{
			ID:    "briQRCheckStatus",
			Label: "BRI QR Check Status",
			Fields: []Field{
				FieldInvoiceNumber,
				FieldTransactionID,
			},
		},
		{
			ID:    "briQRRefund",
			Label: "BRI QR Refund",
			Fields: []Field{
				FieldInvoiceNumber,
				FieldTransactionID,
			},
		},
	},
}
