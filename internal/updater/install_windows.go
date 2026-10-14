//go:build windows

package updater

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const maxExecutableSize = 250 * 1024 * 1024 // 250 MB protection against zip bombs

// CheckWritePermission tests if dir allows file creation and deletion.
func CheckWritePermission(dir string) error {
	testFile := filepath.Join(dir, fmt.Sprintf(".perm_check_%d", os.Getpid()))
	if err := os.WriteFile(testFile, []byte("ok"), 0o644); err != nil {
		return fmt.Errorf("directory is not writable: %w", err)
	}
	_ = os.Remove(testFile)
	return nil
}

// ExtractExecutableFromZip extracts the .exe from the zip into targetPath.
func ExtractExecutableFromZip(zipPath string, targetPath string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("open zip archive: %w", err)
	}
	defer r.Close()

	var exeFile *zip.File
	for _, f := range r.File {
		if strings.HasSuffix(strings.ToLower(f.Name), ".exe") {
			exeFile = f
			break
		}
	}

	if exeFile == nil {
		return fmt.Errorf("no .exe found inside zip archive")
	}

	if exeFile.UncompressedSize64 > maxExecutableSize {
		return fmt.Errorf("executable in archive exceeds size limit (%d bytes)", exeFile.UncompressedSize64)
	}

	rc, err := exeFile.Open()
	if err != nil {
		return fmt.Errorf("read file from zip: %w", err)
	}
	defer rc.Close()

	// Verify PE header ("MZ")
	header := make([]byte, 2)
	if _, err := io.ReadFull(rc, header); err != nil {
		return fmt.Errorf("read executable header: %w", err)
	}
	if !bytes.Equal(header, []byte("MZ")) {
		return fmt.Errorf("file is not a valid Windows executable")
	}

	out, err := os.OpenFile(targetPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o755)
	if err != nil {
		return fmt.Errorf("create new executable file: %w", err)
	}
	defer out.Close()

	if _, err := out.Write(header); err != nil {
		return fmt.Errorf("write executable header: %w", err)
	}

	if _, err := io.Copy(out, rc); err != nil {
		return fmt.Errorf("write executable body: %w", err)
	}

	return nil
}

// SwapExecutable performs the atomic rename swap.
// It places the new executable at currentExePath and renames the current one to .old as rollback copy.
func SwapExecutable(currentExePath string, newExePath string) error {
	oldExePath := currentExePath + ".old"

	// If a previous .old already exists, remove it first
	if _, err := os.Stat(oldExePath); err == nil {
		if err := os.Remove(oldExePath); err != nil {
			return fmt.Errorf("failed to remove previous .old rollback copy: %w", err)
		}
	}

	// 1. Rename running current exe -> .old
	if err := os.Rename(currentExePath, oldExePath); err != nil {
		return fmt.Errorf("failed to move current executable to .old: %w", err)
	}

	// 2. Rename .new -> current exe
	if err := os.Rename(newExePath, currentExePath); err != nil {
		// Rollback! Restore .old back to current exe
		_ = os.Rename(oldExePath, currentExePath)
		return fmt.Errorf("failed to move new executable into place (rolled back): %w", err)
	}

	return nil
}
