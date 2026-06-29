package gencli_test

import (
	"os"
	"path/filepath"
	"testing"

	"db-gui/internal/gencli"
)

func TestResolveExe_DB_GUI_GEN(t *testing.T) {
	dir := t.TempDir()
	exe := filepath.Join(dir, "gen.exe")
	if err := os.WriteFile(exe, []byte("stub"), 0o755); err != nil {
		t.Fatal(err)
	}

	t.Setenv("DB_GUI_GEN", exe)

	got, err := gencli.ResolveExe()
	if err != nil {
		t.Fatal(err)
	}
	if got != exe {
		t.Fatalf("got %q, want %q", got, exe)
	}
}

func TestResolveExe_DevLayout(t *testing.T) {
	root := t.TempDir()
	exe := filepath.Join(root, "gen", "gen.exe")
	if err := os.MkdirAll(filepath.Dir(exe), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(exe, []byte("stub"), 0o755); err != nil {
		t.Fatal(err)
	}

	t.Setenv("DB_GUI_GEN", "")
	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chdir(wd) })
	if err := os.Chdir(root); err != nil {
		t.Fatal(err)
	}

	got, err := gencli.ResolveExe()
	if err != nil {
		t.Fatal(err)
	}
	if got != exe {
		t.Fatalf("got %q, want %q", got, exe)
	}
}

func TestResolveExe_NotFound(t *testing.T) {
	root := t.TempDir()
	t.Setenv("DB_GUI_GEN", "")

	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chdir(wd) })
	if err := os.Chdir(root); err != nil {
		t.Fatal(err)
	}

	_, err = gencli.ResolveExe()
	if err == nil {
		t.Fatal("expected error")
	}
}
