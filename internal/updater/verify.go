package updater

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"strings"
)

// VerifySHA256 compares the sha256 checksum of filePath against expectedHex.
func VerifySHA256(filePath string, expectedHex string) error {
	expectedHex = strings.TrimSpace(strings.ToLower(strings.TrimPrefix(expectedHex, "sha256:")))
	if expectedHex == "" {
		return fmt.Errorf("empty expected sha256 checksum")
	}

	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("open file for verification: %w", err)
	}
	defer file.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return fmt.Errorf("compute sha256 checksum: %w", err)
	}

	actualHex := hex.EncodeToString(hasher.Sum(nil))
	if !strings.EqualFold(actualHex, expectedHex) {
		return fmt.Errorf("checksum mismatch: expected %s, got %s", expectedHex, actualHex)
	}

	return nil
}
