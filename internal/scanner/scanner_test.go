package scanner

import (
	"os"
	"path/filepath"
	"testing"
)

func TestScanBuildsPrunedTree(t *testing.T) {
	root := t.TempDir()
	dbDir := filepath.Join(root, "src", "db")
	otherDir := filepath.Join(root, "src", "other")
	if err := os.MkdirAll(dbDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(otherDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dbDir, "users.table.json"), []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dbDir, "orders.table.json"), []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(otherDir, "readme.txt"), []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}

	tree, err := Scan(root)
	if err != nil {
		t.Fatal(err)
	}

	if len(tree.Children) != 1 || tree.Children[0].Name != "src" {
		t.Fatalf("unexpected top-level children: %+v", tree.Children)
	}

	dbNode := tree.Children[0].Children[0]
	if dbNode.Name != "db" || len(dbNode.Children) != 2 {
		t.Fatalf("unexpected db node: %+v", dbNode)
	}

	if dbNode.Children[0].Path == "" || dbNode.Children[1].Path == "" {
		t.Fatalf("expected file paths on leaves: %+v", dbNode.Children)
	}
}
