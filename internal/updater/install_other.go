//go:build !windows

package updater

import (
	"errors"
	"time"
)

func CheckWritePermission(dir string) error {
	return errors.New("self-update only supported on Windows")
}

func ExtractExecutableFromZip(zipPath string, targetPath string) error {
	return errors.New("self-update only supported on Windows")
}

func SwapExecutable(currentExePath string, newExePath string) error {
	return errors.New("self-update only supported on Windows")
}

func Relaunch(exePath string, oldPID int) error {
	return errors.New("self-update only supported on Windows")
}

func WaitForProcessExit(pid int, timeout time.Duration) error {
	return nil
}
