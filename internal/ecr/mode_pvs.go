package ecr

var ModePVS = Mode{
	ID:    "pvs",
	Label: "PVS",
	TransactionTypes: []TransactionType{
		{
			ID:    "saleRegular",
			Label: "Sale (Regular)",
			Fields: []Field{
				FieldAmount,
				FieldTipAmount,
				FieldTransactionID,
			},
		},
		{
			ID:    "saleInstallment",
			Label: "Sale (Installment)",
			Fields: []Field{
				FieldAmount,
				FieldInstallmentPlan,
				FieldInstallmentTenor,
				FieldTransactionID,
			},
		},
		{
			ID:    "salePayment",
			Label: "Sale (Payment)",
			Fields: []Field{
				FieldAmount,
				FieldTipAmount,
				FieldTransactionID,
			},
		},
		{
			ID:    "voidRegular",
			Label: "Void (Regular)",
			Fields: []Field{
				FieldTraceNumber,
				FieldTransactionID,
			},
		},
		{
			ID:    "lastECRTransaction",
			Label: "Last ECR Transaction",
			Fields: []Field{
				FieldTransactionID,
			},
		},
		{
			ID:    "anyECRTransaction",
			Label: "Any ECR Transaction",
			Fields: []Field{
				FieldTransactionID,
			},
		},
	},
}
