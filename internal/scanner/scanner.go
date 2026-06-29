package scanner

import (
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type TreeNode struct {
	Name     string     `json:"name"`
	Path     string     `json:"path"`
	IsDir    bool       `json:"isDir"`
	Children []TreeNode `json:"children"`
}

const (
	tableJSONSuffix = ".table.json"
	sqlSuffix       = ".sql"
	xlsxSuffix      = ".xlsx"
)

func isVisibleFile(name string) bool {
	return strings.HasSuffix(name, tableJSONSuffix) ||
		strings.HasSuffix(name, sqlSuffix) ||
		strings.HasSuffix(name, xlsxSuffix)
}

func Scan(root string) (TreeNode, error) {
	root, err := filepath.Abs(filepath.Clean(root))
	if err != nil {
		return TreeNode{}, err
	}

	info, err := os.Stat(root)
	if err != nil {
		return TreeNode{}, err
	}
	if !info.IsDir() {
		return TreeNode{}, fs.ErrInvalid
	}

	return scanDir(root)
}

func scanDir(dir string) (TreeNode, error) {
	node := TreeNode{
		Name:     filepath.Base(dir),
		Path:     dir,
		IsDir:    true,
		Children: []TreeNode{},
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return TreeNode{}, err
	}

	for _, entry := range entries {
		name := entry.Name()
		path := filepath.Join(dir, name)

		if entry.IsDir() {
			child, err := scanDir(path)
			if err != nil {
				log.Printf("scanner: skip %s: %v", path, err)
				continue
			}
			node.Children = append(node.Children, child)
			continue
		}

		if isVisibleFile(name) {
			node.Children = append(node.Children, TreeNode{
				Name:     name,
				Path:     path,
				IsDir:    false,
				Children: []TreeNode{},
			})
		}
	}

	sortTree(&node)
	return node, nil
}

func sortTree(node *TreeNode) {
	sort.Slice(node.Children, func(i, j int) bool {
		if node.Children[i].IsDir != node.Children[j].IsDir {
			return node.Children[i].IsDir
		}
		return node.Children[i].Name < node.Children[j].Name
	})

	for i := range node.Children {
		sortTree(&node.Children[i])
	}
}
