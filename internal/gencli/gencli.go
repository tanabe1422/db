package gencli

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// ErrNotInstalled is returned when gen.exe cannot be located.
var ErrNotInstalled = errors.New("gencli: gen.exe が見つかりません (gen/gen.exe に配置してください)")

type scriptOutput struct {
	RelPath string `json:"relPath"`
	SQL     string `json:"sql"`
}

type xlsxExportOutput struct {
	RelPath string `json:"relPath"`
	Data    string `json:"data"`
}

type xlsxImportOutput struct {
	RelPath   string `json:"relPath"`
	TableJSON string `json:"tableJSON"`
}

// ResolveExe locates gen.exe per gen/CLI.md.
func ResolveExe() (string, error) {
	if p := strings.TrimSpace(os.Getenv("DB_GUI_GEN")); p != "" {
		if _, err := os.Stat(p); err == nil {
			return p, nil
		}
		return "", fmt.Errorf("%w (DB_GUI_GEN=%s)", ErrNotInstalled, p)
	}

	if cwd, err := os.Getwd(); err == nil {
		devPath := filepath.Join(cwd, "gen", "gen.exe")
		if _, err := os.Stat(devPath); err == nil {
			return devPath, nil
		}
	}

	exe, err := os.Executable()
	if err != nil {
		return "", ErrNotInstalled
	}
	shipPath := filepath.Join(filepath.Dir(exe), "gen.exe")
	if _, err := os.Stat(shipPath); err == nil {
		return shipPath, nil
	}

	return "", ErrNotInstalled
}

// CreateScript runs gen.exe create-script.
func CreateScript(tableJSON []byte) (sql, relPath string, err error) {
	exe, err := ResolveExe()
	if err != nil {
		return "", "", err
	}
	var out scriptOutput
	if err := run(exe, []string{"create-script", "--input", "-"}, tableJSON, &out); err != nil {
		return "", "", err
	}
	return out.SQL, out.RelPath, nil
}

// MigrateScript runs gen.exe migrate-script.
func MigrateScript(beforeJSON, afterJSON []byte) (sql, relPath string, err error) {
	exe, err := ResolveExe()
	if err != nil {
		return "", "", err
	}

	beforePath, err := writeTempFile("db-gui-before-", beforeJSON)
	if err != nil {
		return "", "", err
	}
	defer os.Remove(beforePath)

	afterPath, err := writeTempFile("db-gui-after-", afterJSON)
	if err != nil {
		return "", "", err
	}
	defer os.Remove(afterPath)

	var out scriptOutput
	if err := run(exe, []string{
		"migrate-script",
		"--before", beforePath,
		"--after", afterPath,
	}, nil, &out); err != nil {
		return "", "", err
	}
	return out.SQL, out.RelPath, nil
}

// XlsxExport runs gen.exe xlsx-export.
func XlsxExport(tableJSON []byte) (data []byte, relPath string, err error) {
	exe, err := ResolveExe()
	if err != nil {
		return nil, "", err
	}
	var out xlsxExportOutput
	if err := run(exe, []string{"xlsx-export", "--input", "-"}, tableJSON, &out); err != nil {
		return nil, "", err
	}
	data, err = base64.StdEncoding.DecodeString(out.Data)
	if err != nil {
		return nil, "", fmt.Errorf("gen.exe xlsx-export: invalid base64 data: %w", err)
	}
	return data, out.RelPath, nil
}

// XlsxImport runs gen.exe xlsx-import.
func XlsxImport(xlsxData []byte) (tableJSON []byte, relPath string, err error) {
	exe, err := ResolveExe()
	if err != nil {
		return nil, "", err
	}
	var out xlsxImportOutput
	if err := run(exe, []string{"xlsx-import", "--input", "-"}, xlsxData, &out); err != nil {
		return nil, "", err
	}
	return []byte(out.TableJSON), out.RelPath, nil
}

func run(exe string, args []string, stdin []byte, out interface{}) error {
	cmd := exec.Command(exe, args...)
	if len(stdin) > 0 {
		cmd.Stdin = bytes.NewReader(stdin)
	}

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	stdout, err := cmd.Output()
	if err != nil {
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		subcmd := args[0]
		return fmt.Errorf("gen.exe %s: %s", subcmd, msg)
	}

	line := bytes.TrimSpace(stdout)
	if len(line) == 0 {
		return fmt.Errorf("gen.exe %s: empty stdout", args[0])
	}
	if err := json.Unmarshal(line, out); err != nil {
		return fmt.Errorf("gen.exe %s: invalid JSON output: %w", args[0], err)
	}
	return nil
}

func writeTempFile(prefix string, data []byte) (string, error) {
	f, err := os.CreateTemp("", prefix+"*.table.json")
	if err != nil {
		return "", err
	}
	path := f.Name()
	if _, err := f.Write(data); err != nil {
		f.Close()
		os.Remove(path)
		return "", err
	}
	if err := f.Close(); err != nil {
		os.Remove(path)
		return "", err
	}
	return path, nil
}
