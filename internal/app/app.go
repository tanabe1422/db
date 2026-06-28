package app

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"db-gui/internal/config"
	"db-gui/internal/scanner"
)

const tableJSONSuffix = ".table.json"

// App exposes methods to the React frontend via Wails bindings.
type App struct {
	ctx context.Context
}

func New() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetSettings() (config.Settings, error) {
	return config.Load()
}

func (a *App) AddDirectory(path string) (config.Settings, error) {
	settings, err := config.Load()
	if err != nil {
		return config.Settings{}, err
	}

	settings, err = config.AddDirectory(settings, path)
	if err != nil {
		return config.Settings{}, err
	}

	if err := config.Save(settings); err != nil {
		return config.Settings{}, err
	}

	return settings, nil
}

func (a *App) RemoveDirectory(path string) (config.Settings, error) {
	settings, err := config.Load()
	if err != nil {
		return config.Settings{}, err
	}

	settings, err = config.RemoveDirectory(settings, path)
	if err != nil {
		return config.Settings{}, err
	}

	if err := config.Save(settings); err != nil {
		return config.Settings{}, err
	}

	return settings, nil
}

func (a *App) SetActiveDirectory(path string) (config.Settings, error) {
	settings, err := config.Load()
	if err != nil {
		return config.Settings{}, err
	}

	settings, err = config.SetActiveDirectory(settings, path)
	if err != nil {
		return config.Settings{}, err
	}

	if err := config.Save(settings); err != nil {
		return config.Settings{}, err
	}

	return settings, nil
}

func (a *App) PickDirectory() (string, error) {
	if a.ctx == nil {
		return "", errors.New("application context is not ready")
	}

	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "参照ディレクトリを選択",
	})
}

func (a *App) ScanActiveDirectory() (scanner.TreeNode, error) {
	settings, err := config.Load()
	if err != nil {
		return scanner.TreeNode{}, err
	}

	if settings.ActiveDirectory == "" {
		return scanner.TreeNode{}, nil
	}

	return scanner.Scan(settings.ActiveDirectory)
}

// ReadTableFile reads the raw JSON content of a *.table.json file located
// under one of the configured directories. Parsing and validation are handled
// on the frontend side.
func (a *App) ReadTableFile(path string) (string, error) {
	abs, err := filepath.Abs(filepath.Clean(path))
	if err != nil {
		return "", err
	}

	if !strings.HasSuffix(abs, tableJSONSuffix) {
		return "", errors.New("not a *.table.json file")
	}

	settings, err := config.Load()
	if err != nil {
		return "", err
	}

	if !isUnderConfiguredDirectory(abs, settings.Directories) {
		return "", errors.New("path is outside the configured directories")
	}

	data, err := os.ReadFile(abs)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

// WriteTableFile writes content back to a *.table.json file. The same safety
// checks as ReadTableFile apply: the path must end with .table.json and live
// under one of the configured directories.
func (a *App) WriteTableFile(path string, content string) error {
	abs, err := filepath.Abs(filepath.Clean(path))
	if err != nil {
		return err
	}

	if !strings.HasSuffix(abs, tableJSONSuffix) {
		return errors.New("not a *.table.json file")
	}

	settings, err := config.Load()
	if err != nil {
		return err
	}

	if !isUnderConfiguredDirectory(abs, settings.Directories) {
		return errors.New("path is outside the configured directories")
	}

	return os.WriteFile(abs, []byte(content), 0o644)
}

func isUnderConfiguredDirectory(target string, directories []string) bool {
	for _, dir := range directories {
		if dir == "" {
			continue
		}
		rel, err := filepath.Rel(dir, target)
		if err != nil {
			continue
		}
		if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
			continue
		}
		return true
	}
	return false
}
