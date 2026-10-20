package variant

import "testing"

func TestVariant_Methods(t *testing.T) {
	if Standard.String() != "standard" {
		t.Errorf("expected standard, got %s", Standard.String())
	}
	if BRI.String() != "bri" {
		t.Errorf("expected bri, got %s", BRI.String())
	}
	if Standard.Suffix() != "" {
		t.Errorf("expected empty suffix, got %s", Standard.Suffix())
	}
	if BRI.Suffix() != "-bri" {
		t.Errorf("expected -bri suffix, got %s", BRI.Suffix())
	}
}

func TestFromVersion(t *testing.T) {
	tests := []struct {
		input    string
		expected Type
	}{
		{"2.3.0", Standard},
		{"v2.3.0", Standard},
		{"2.3.0-dev", Standard},
		{"2.3.0-bri", BRI},
		{"v2.4.0-BRI", BRI},
		{"", Standard},
	}

	for _, tc := range tests {
		got := FromVersion(tc.input)
		if got != tc.expected {
			t.Errorf("FromVersion(%q) = %v, expected %v", tc.input, got, tc.expected)
		}
	}
}
