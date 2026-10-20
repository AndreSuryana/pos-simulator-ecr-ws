package variant

import "strings"

// Type identifies the application build variant.
type Type string

const (
	Standard Type = "standard"
	BRI      Type = "bri"
)

// String returns string representation of the variant.
func (t Type) String() string {
	return string(t)
}

// Suffix returns the release archive and version suffix for this variant.
func (t Type) Suffix() string {
	switch t {
	case BRI:
		return "-bri"
	default:
		return ""
	}
}

// FromVersion extracts the build variant from a version string (e.g. "2.3.0-bri" -> BRI).
func FromVersion(version string) Type {
	lower := strings.ToLower(strings.TrimSpace(version))
	if strings.HasSuffix(lower, "-bri") {
		return BRI
	}
	return Standard
}
