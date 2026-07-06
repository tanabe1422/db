//go:build !windows

package gencli

import "os/exec"

func configureCmd(cmd *exec.Cmd) {}
