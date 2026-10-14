//go:build windows

package updater

import (
	"fmt"
	"os/exec"
	"syscall"
)

// Relaunch starts the updated executable detached, passing --after-update=<oldPID>.
func Relaunch(exePath string, oldPID int) error {
	cmd := exec.Command(exePath, fmt.Sprintf("--after-update=%d", oldPID))
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP | 0x00000008, // DETACHED_PROCESS
	}
	cmd.Stdin = nil
	cmd.Stdout = nil
	cmd.Stderr = nil

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("start updated process: %w", err)
	}

	return nil
}
