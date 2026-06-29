package app

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestValidateBaseName(t *testing.T) {
	if err := validateBaseName(""); err == nil {
		t.Fatal("expected error for empty name")
	}
	if err := validateBaseName("a/b"); err == nil {
		t.Fatal("expected error for path separator")
	}
	if err := validateBaseName("users"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestNormalizeTableFileName(t *testing.T) {
	fileName, logical, err := normalizeTableFileName("orders")
	if err != nil {
		t.Fatalf("normalize: %v", err)
	}
	if fileName != "orders.table.json" || logical != "orders" {
		t.Fatalf("got %q / %q", fileName, logical)
	}

	fileName, logical, err = normalizeTableFileName("sales.table.json")
	if err != nil {
		t.Fatalf("normalize with suffix: %v", err)
	}
	if fileName != "sales.table.json" || logical != "sales" {
		t.Fatalf("got %q / %q", fileName, logical)
	}
}

func TestUniqueDestPath(t *testing.T) {
	dir := t.TempDir()
	existing := filepath.Join(dir, "users.table.json")
	if err := os.WriteFile(existing, []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}

	dest, err := uniqueDestPath(dir, "users.table.json")
	if err != nil {
		t.Fatalf("uniqueDestPath: %v", err)
	}
	if dest == existing {
		t.Fatal("expected a different path")
	}
	if filepath.Base(dest) != "users copy.table.json" {
		t.Fatalf("expected copy suffix, got %s", dest)
	}

	copyPath := filepath.Join(dir, "users copy.table.json")
	if err := os.WriteFile(copyPath, []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}

	dest2, err := uniqueDestPath(dir, "users.table.json")
	if err != nil {
		t.Fatalf("uniqueDestPath second: %v", err)
	}
	if filepath.Base(dest2) != "users copy 2.table.json" {
		t.Fatalf("expected numbered copy suffix, got %s", dest2)
	}
}

func TestNewTableJSONContent(t *testing.T) {
	content, err := newTableJSONContent("users", "")
	if err != nil {
		t.Fatalf("newTableJSONContent: %v", err)
	}
	if !strings.Contains(content, `"name": "users"`) {
		t.Fatalf("unexpected content: %s", content)
	}
}
