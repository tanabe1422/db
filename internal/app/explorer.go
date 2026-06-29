package app

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func showInExplorer(path string) error {
	info, err := os.Stat(path)
	if err != nil {
		return err
	}

	switch runtime.GOOS {
	case "windows":
		if info.IsDir() {
			return exec.Command("explorer", path).Start()
		}
		return exec.Command("explorer", "/select,", path).Start()
	case "darwin":
		if info.IsDir() {
			return exec.Command("open", path).Start()
		}
		return exec.Command("open", "-R", path).Start()
	default:
		target := path
		if !info.IsDir() {
			target = filepath.Dir(path)
		}
		return exec.Command("xdg-open", target).Start()
	}
}

// ShowInExplorer opens the system file manager at the given path. Files are
// selected; directories are opened directly.
func (a *App) ShowInExplorer(path string) error {
	abs, err := filepath.Abs(filepath.Clean(path))
	if err != nil {
		return err
	}
	return showInExplorer(abs)
}

func openWithDefaultApp(path string) error {
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	if info.IsDir() {
		return errors.New("not a file")
	}

	switch runtime.GOOS {
	case "windows":
		return exec.Command("cmd", "/c", "start", "", filepath.Clean(path)).Start()
	case "darwin":
		return exec.Command("open", path).Start()
	default:
		return exec.Command("xdg-open", path).Start()
	}
}

// OpenWithDefaultApp opens a file with the OS default application. The path must
// be under one of the configured directories.
func (a *App) OpenWithDefaultApp(path string) error {
	abs, err := a.absPathUnderDirs(path)
	if err != nil {
		return err
	}
	return openWithDefaultApp(abs)
}
