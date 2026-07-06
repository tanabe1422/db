//go:build windows

package gencli

import (
	"os/exec"
	"syscall"
)

// CREATE_NO_WINDOW prevents a console window from flashing when spawning gen.exe.
const createNoWindow = 0x08000000

func configureCmd(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: createNoWindow,
	}
}
