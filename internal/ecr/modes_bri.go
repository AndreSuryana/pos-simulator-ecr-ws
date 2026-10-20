//go:build bri

package ecr

// AvailableModes returns all supported ECR modes for BRI variant.
func AvailableModes() []Mode {
	return []Mode{
		ModeBRI,
	}
}
