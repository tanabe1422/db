package app

import (
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"

	"db-gui/internal/config"
)

func setTestConfigDir(t *testing.T) {
	t.Helper()
	root := t.TempDir()
	if runtime.GOOS == "windows" {
		t.Setenv("APPDATA", root)
	} else {
		t.Setenv("XDG_CONFIG_HOME", root)
	}
}

func installStubGen(t *testing.T, stdoutLine string) string {
	t.Helper()
	dir := t.TempDir()
	src := filepath.Join(dir, "main.go")
	source := fmt.Sprintf(`package main
import "fmt"
func main() { fmt.Print(%q) }
`, stdoutLine+"\n")
	if err := os.WriteFile(src, []byte(source), 0o644); err != nil {
		t.Fatal(err)
	}
	exe := filepath.Join(dir, "gen.exe")
	out, err := exec.Command("go", "build", "-o", exe, src).CombinedOutput()
	if err != nil {
		t.Fatalf("build stub gen: %v\n%s", err, out)
	}
	return exe
}

func TestWriteExportBinaryFile(t *testing.T) {
	exportRoot := t.TempDir()
	app := &App{}

	data := []byte{0x50, 0x4b, 0x03, 0x04}
	if err := app.writeExportBinaryFile(exportRoot, "nested/users.xlsx", data); err != nil {
		t.Fatalf("writeExportBinaryFile: %v", err)
	}

	got, err := os.ReadFile(filepath.Join(exportRoot, "nested", "users.xlsx"))
	if err != nil {
		t.Fatalf("read written file: %v", err)
	}
	if string(got) != string(data) {
		t.Fatalf("got %v, want %v", got, data)
	}
}

func TestWriteXlsxExportUsesGeneratorRelPath(t *testing.T) {
	setTestConfigDir(t)

	projectRoot := t.TempDir()
	tablePath := filepath.Join(projectRoot, "users.table.json")
	if err := os.WriteFile(tablePath, []byte(`{"name":"users"}`), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := config.Save(config.Settings{
		Directories:     []string{projectRoot},
		ActiveDirectory: projectRoot,
	}); err != nil {
		t.Fatal(err)
	}

	xlsxData := []byte{0x50, 0x4b, 0x03, 0x04}
	stub := installStubGen(t, fmt.Sprintf(
		`{"relPath":"custom/users.xlsx","data":"%s"}`,
		base64.StdEncoding.EncodeToString(xlsxData),
	))
	t.Setenv("DB_GUI_GEN", stub)

	exportRoot := t.TempDir()
	app := &App{}
	if err := app.WriteXlsxExport(exportRoot, tablePath, "users.xlsx"); err != nil {
		t.Fatalf("WriteXlsxExport: %v", err)
	}

	got, err := os.ReadFile(filepath.Join(exportRoot, "custom", "users.xlsx"))
	if err != nil {
		t.Fatalf("read written file: %v", err)
	}
	if string(got) != string(xlsxData) {
		t.Fatalf("got %v, want %v", got, xlsxData)
	}
}

func TestWriteXlsxExportUsesFallbackRelPath(t *testing.T) {
	setTestConfigDir(t)

	projectRoot := t.TempDir()
	tablePath := filepath.Join(projectRoot, "orders.table.json")
	if err := os.WriteFile(tablePath, []byte(`{"name":"orders"}`), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := config.Save(config.Settings{
		Directories:     []string{projectRoot},
		ActiveDirectory: projectRoot,
	}); err != nil {
		t.Fatal(err)
	}

	xlsxData := []byte{0x50, 0x4b, 0x03, 0x04}
	stub := installStubGen(t, fmt.Sprintf(
		`{"relPath":"","data":"%s"}`,
		base64.StdEncoding.EncodeToString(xlsxData),
	))
	t.Setenv("DB_GUI_GEN", stub)

	exportRoot := t.TempDir()
	app := &App{}
	if err := app.WriteXlsxExport(exportRoot, tablePath, "orders.xlsx"); err != nil {
		t.Fatalf("WriteXlsxExport: %v", err)
	}

	got, err := os.ReadFile(filepath.Join(exportRoot, "orders.xlsx"))
	if err != nil {
		t.Fatalf("read written file: %v", err)
	}
	if string(got) != string(xlsxData) {
		t.Fatalf("got %v, want %v", got, xlsxData)
	}
}

func TestImportOutputPath(t *testing.T) {
	target := `C:\project\src\db`
	source := `D:\imports`
	xlsxPath := filepath.Join(source, "nested", "users.xlsx")

	got, err := importOutputPath(target, source, xlsxPath, "")
	if err != nil {
		t.Fatalf("importOutputPath: %v", err)
	}

	want := filepath.Join(target, "nested", "users.table.json")
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}

func TestImportOutputPathUsesGeneratorRelPath(t *testing.T) {
	target := `C:\project\src\db`
	source := `D:\imports`
	xlsxPath := filepath.Join(source, "users.xlsx")

	got, err := importOutputPath(target, source, xlsxPath, "custom/users.table.json")
	if err != nil {
		t.Fatalf("importOutputPath: %v", err)
	}

	want := filepath.Join(target, "custom", "users.table.json")
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}
