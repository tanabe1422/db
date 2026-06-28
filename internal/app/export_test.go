package app

import (
	"os"
	"path/filepath"
	"testing"
)

func TestPrepareExportDirectory(t *testing.T) {
	root := t.TempDir()
	app := New()

	exportRoot, err := app.PrepareExportDirectory(root)
	if err != nil {
		t.Fatalf("PrepareExportDirectory: %v", err)
	}

	info, err := os.Stat(exportRoot)
	if err != nil {
		t.Fatalf("stat export root: %v", err)
	}
	if !info.IsDir() {
		t.Fatal("export root is not a directory")
	}

	rel, err := filepath.Rel(root, exportRoot)
	if err != nil {
		t.Fatalf("filepath.Rel: %v", err)
	}
	if filepath.Dir(rel) != exportDirName {
		t.Fatalf("expected parent %q, got %q", exportDirName, filepath.Dir(rel))
	}
}

func TestEnsureExportRelDir(t *testing.T) {
	root := t.TempDir()
	app := New()

	relPath := "src/db/users.sql"
	if err := app.EnsureExportRelDir(root, relPath); err != nil {
		t.Fatalf("EnsureExportRelDir: %v", err)
	}

	want := filepath.Join(root, "src", "db")
	if _, err := os.Stat(want); err != nil {
		t.Fatalf("expected dir %q: %v", want, err)
	}
}
