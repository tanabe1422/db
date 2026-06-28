package app

import (
	"os"
	"path/filepath"
	"strings"
	"time"
)

const exportDirName = "export"

// PrepareExportDirectory creates {activeDirectory}/export/YYYYMMDDHHmm/ and
// returns the absolute path to the timestamped folder.
func (a *App) PrepareExportDirectory(activeDirectory string) (string, error) {
	root, err := filepath.Abs(filepath.Clean(activeDirectory))
	if err != nil {
		return "", err
	}

	stamp := time.Now().Format("200601021504")
	exportRoot := filepath.Join(root, exportDirName, stamp)
	if err := os.MkdirAll(exportRoot, 0o755); err != nil {
		return "", err
	}

	return exportRoot, nil
}

// EnsureExportRelDir creates parent directories for a relative file path under
// exportRoot. relativePath uses forward slashes (e.g. "src/db/users.sql").
func (a *App) EnsureExportRelDir(exportRoot, relativePath string) error {
	root, err := filepath.Abs(filepath.Clean(exportRoot))
	if err != nil {
		return err
	}

	rel := filepath.FromSlash(strings.TrimPrefix(relativePath, "/"))
	if rel == "" || rel == "." {
		return nil
	}

	parent := filepath.Dir(filepath.Join(root, rel))
	if parent == root || parent == "." {
		return nil
	}

	return os.MkdirAll(parent, 0o755)
}
