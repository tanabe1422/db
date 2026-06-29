package scanner

import (
	"os"
	"path/filepath"
	"testing"
)

func TestScanIncludesAllDirectories(t *testing.T) {
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
	if err := os.WriteFile(filepath.Join(dbDir, "users.sql"), []byte("CREATE TABLE users;"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dbDir, "orders.xlsx"), []byte("xlsx"), 0o644); err != nil {
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

	srcNode := tree.Children[0]
	if len(srcNode.Children) != 2 {
		t.Fatalf("expected src to have db and other, got %+v", srcNode.Children)
	}

	var dbNode, otherNode *TreeNode
	for i := range srcNode.Children {
		switch srcNode.Children[i].Name {
		case "db":
			dbNode = &srcNode.Children[i]
		case "other":
			otherNode = &srcNode.Children[i]
		}
	}

	if dbNode == nil || len(dbNode.Children) != 4 {
		t.Fatalf("unexpected db node: %+v", dbNode)
	}
	if dbNode.Children[0].Path == "" || dbNode.Children[1].Path == "" {
		t.Fatalf("expected file paths on leaves: %+v", dbNode.Children)
	}

	if otherNode == nil {
		t.Fatal("expected other directory in tree")
	}
	if !otherNode.IsDir || len(otherNode.Children) != 0 {
		t.Fatalf("other should be an empty directory, got %+v", otherNode)
	}
}
