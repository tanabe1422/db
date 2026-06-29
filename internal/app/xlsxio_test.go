package app

import (
	"path/filepath"
	"testing"
)

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
