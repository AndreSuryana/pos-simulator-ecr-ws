//go:build !bri

package ecr

// AvailableModes returns all supported ECR modes for standard build.
func AvailableModes() []Mode {
	return []Mode{
		ModePVS,
		ModeBRI,
	}
}
