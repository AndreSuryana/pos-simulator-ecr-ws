package ecr

import (
	"testing"
)

func TestModes_Definitions(t *testing.T) {
	modes := []Mode{ModeBRI, ModePVS}

	for _, mode := range modes {
		if mode.ID == "" {
			t.Errorf("mode ID is empty")
		}
		if mode.Label == "" {
			t.Errorf("mode %q label is empty", mode.ID)
		}
		if len(mode.TransactionTypes) == 0 {
			t.Errorf("mode %q has no transaction types", mode.ID)
		}

		for _, txType := range mode.TransactionTypes {
			if txType.ID == "" {
				t.Errorf("mode %q has transaction type with empty ID", mode.ID)
			}
			if txType.Label == "" {
				t.Errorf("mode %q txType %q has empty Label", mode.ID, txType.ID)
			}

			for _, f := range txType.Fields {
				if f.Key == "" {
					t.Errorf("txType %q in mode %q has field with empty Key", txType.ID, mode.ID)
				}
				if f.Label == "" {
					t.Errorf("field %q in txType %q has empty Label", f.Key, txType.ID)
				}
			}
		}
	}
}
