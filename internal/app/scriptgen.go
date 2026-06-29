package app

import (
	"os"
	"path/filepath"
	"strings"

	"db-gui/internal/sqlgen"
)

// ScriptResult is the output of create/migrate script generation.
type ScriptResult struct {
	SQL     string `json:"sql"`
	RelPath string `json:"relPath"`
}

// GenerateCreateScript turns one *.table.json into DDL SQL via the private implementation.
func (a *App) GenerateCreateScript(tableJSON string) (ScriptResult, error) {
	gen, err := sqlgen.NewCreateScript()
	if err != nil {
		return ScriptResult{}, err
	}

	sql, relPath, err := gen.Generate([]byte(tableJSON))
	if err != nil {
		return ScriptResult{}, err
	}

	return ScriptResult{SQL: sql, RelPath: relPath}, nil
}

// GenerateMigrateScript compares two *.table.json files and emits migration SQL.
func (a *App) GenerateMigrateScript(beforeJSON, afterJSON string) (ScriptResult, error) {
	gen, err := sqlgen.NewMigrateScript()
	if err != nil {
		return ScriptResult{}, err
	}

	sql, relPath, err := gen.Generate([]byte(beforeJSON), []byte(afterJSON))
	if err != nil {
		return ScriptResult{}, err
	}

	return ScriptResult{SQL: sql, RelPath: relPath}, nil
}

// WriteExportFile writes a text file under exportRoot at relativePath.
func (a *App) WriteExportFile(exportRoot, relativePath, content string) error {
	root, err := filepath.Abs(filepath.Clean(exportRoot))
	if err != nil {
		return err
	}

	rel := filepath.FromSlash(strings.TrimPrefix(relativePath, "/"))
	if rel == "" || rel == "." {
		return nil
	}

	if err := a.EnsureExportRelDir(exportRoot, relativePath); err != nil {
		return err
	}

	target := filepath.Join(root, rel)
	return os.WriteFile(target, []byte(content), 0o644)
}
