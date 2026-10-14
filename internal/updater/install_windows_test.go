//go:build windows

package updater

import (
	"archive/zip"
	"os"
	"path/filepath"
	"testing"
)

func TestExtractExecutableAndSwap(t *testing.T) {
	tempDir := t.TempDir()

	// 1. Create a mock zip with a valid PE header (MZ)
	zipPath := filepath.Join(tempDir, "release.zip")
	zipFile, err := os.Create(zipPath)
	if err != nil {
		t.Fatalf("create zip file: %v", err)
	}

	zw := zip.NewWriter(zipFile)
	w, err := zw.Create("pos-ecr-simulator.exe")
	if err != nil {
		t.Fatalf("create zip entry: %v", err)
	}

	mockExeContent := append([]byte("MZ"), []byte("...mock-new-executable-binary-content...")...)
	if _, err := w.Write(mockExeContent); err != nil {
		t.Fatalf("write zip content: %v", err)
	}
	if err := zw.Close(); err != nil {
		t.Fatalf("close zip writer: %v", err)
	}
	_ = zipFile.Close()

	// 2. Create mock "running" current exe
	currentExe := filepath.Join(tempDir, "pos-ecr-simulator.exe")
	if err := os.WriteFile(currentExe, []byte("MZ...running-old-version..."), 0o755); err != nil {
		t.Fatalf("write current exe: %v", err)
	}

	// 3. Extract to .new
	newExe := currentExe + ".new"
	if err := ExtractExecutableFromZip(zipPath, newExe); err != nil {
		t.Fatalf("ExtractExecutableFromZip failed: %v", err)
	}

	newBytes, err := os.ReadFile(newExe)
	if err != nil {
		t.Fatalf("read new exe: %v", err)
	}
	if string(newBytes) != string(mockExeContent) {
		t.Errorf("extracted content mismatch")
	}

	// 4. Test SwapExecutable
	if err := SwapExecutable(currentExe, newExe); err != nil {
		t.Fatalf("SwapExecutable failed: %v", err)
	}

	// Verify currentExe now has the new content
	updatedBytes, err := os.ReadFile(currentExe)
	if err != nil {
		t.Fatalf("read updated exe: %v", err)
	}
	if string(updatedBytes) != string(mockExeContent) {
		t.Errorf("updated exe does not match new content")
	}

	// Verify .old exists and has the old content
	oldExe := currentExe + ".old"
	oldBytes, err := os.ReadFile(oldExe)
	if err != nil {
		t.Fatalf("read old exe: %v", err)
	}
	if string(oldBytes) != "MZ...running-old-version..." {
		t.Errorf("old rollback exe does not match original content")
	}

	// 5. Test Swap again to verify replacing existing .old
	mockExeContent2 := append([]byte("MZ"), []byte("...v3...")...)
	w2, err := os.Create(newExe)
	if err != nil {
		t.Fatalf("create new exe 2: %v", err)
	}
	_, _ = w2.Write(mockExeContent2)
	_ = w2.Close()

	if err := SwapExecutable(currentExe, newExe); err != nil {
		t.Fatalf("second SwapExecutable failed: %v", err)
	}

	secondUpdatedBytes, _ := os.ReadFile(currentExe)
	if string(secondUpdatedBytes) != string(mockExeContent2) {
		t.Errorf("second update failed")
	}

	secondOldBytes, _ := os.ReadFile(oldExe)
	if string(secondOldBytes) != string(mockExeContent) {
		t.Errorf("second rollback copy failed to preserve previous version")
	}
}
