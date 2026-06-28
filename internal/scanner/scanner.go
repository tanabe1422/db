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

const tableJSONSuffix = ".table.json"

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

	matches := make([]string, 0)
	err = filepath.WalkDir(root, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			log.Printf("scanner: skip %s: %v", path, walkErr)
			return nil
		}
		if entry.IsDir() {
			return nil
		}
		if strings.HasSuffix(entry.Name(), tableJSONSuffix) {
			matches = append(matches, path)
		}
		return nil
	})
	if err != nil {
		return TreeNode{}, err
	}

	return buildTree(root, matches), nil
}

func buildTree(root string, matches []string) TreeNode {
	rootNode := TreeNode{
		Name:     filepath.Base(root),
		Path:     root,
		IsDir:    true,
		Children: []TreeNode{},
	}

	if len(matches) == 0 {
		return rootNode
	}

	type treeBuilder struct {
		node *TreeNode
	}

	nodes := map[string]*treeBuilder{
		root: {node: &rootNode},
	}

	for _, match := range matches {
		rel, err := filepath.Rel(root, match)
		if err != nil {
			continue
		}

		parts := strings.Split(filepath.ToSlash(rel), "/")
		currentPath := root

		for i, part := range parts {
			currentPath = filepath.Join(currentPath, part)
			if _, exists := nodes[currentPath]; exists {
				continue
			}

			isDir := i < len(parts)-1
			child := TreeNode{
				Name:     part,
				Path:     currentPath,
				IsDir:    isDir,
				Children: []TreeNode{},
			}
			if !isDir {
				child.Path = match
			}

			parentPath := filepath.Dir(currentPath)
			parent, ok := nodes[parentPath]
			if !ok {
				continue
			}

			parent.node.Children = append(parent.node.Children, child)
			lastIndex := len(parent.node.Children) - 1
			nodes[currentPath] = &treeBuilder{node: &parent.node.Children[lastIndex]}
		}
	}

	sortTree(&rootNode)
	return rootNode
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
