//go:build windows

package updater

import (
	"fmt"
	"time"

	"golang.org/x/sys/windows"
)

// WaitForProcessExit waits up to timeout for the specified PID to terminate.
func WaitForProcessExit(pid int, timeout time.Duration) error {
	if pid <= 0 {
		return nil
	}

	handle, err := windows.OpenProcess(windows.SYNCHRONIZE, false, uint32(pid))
	if err != nil {
		// Process may have already exited
		return nil
	}
	defer windows.CloseHandle(handle)

	millis := uint32(timeout.Milliseconds())
	event, err := windows.WaitForSingleObject(handle, millis)
	if err != nil {
		return fmt.Errorf("wait for process: %w", err)
	}

	if event == uint32(windows.WAIT_TIMEOUT) {
		return fmt.Errorf("timed out waiting for process %d to exit", pid)
	}

	return nil
}
