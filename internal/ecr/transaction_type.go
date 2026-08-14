package ecr

// TransactionType defines an ECR transaction.
type TransactionType struct {
	ID     string
	Label  string
	Fields []Field
}
