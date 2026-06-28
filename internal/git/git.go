package git

import (
	"bytes"
	"errors"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"
)

const tableJSONSuffix = ".table.json"

// Commit is a single entry from git log.
type Commit struct {
	Hash      string `json:"hash"`
	ShortHash string `json:"shortHash"`
	Subject   string `json:"subject"`
	Date      string `json:"date"`
}

// RepoInfo describes whether a directory is inside a git repository.
type RepoInfo struct {
	IsRepo   bool   `json:"isRepo"`
	RepoRoot string `json:"repoRoot"`
}

func runGit(dir string, args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = dir
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return "", errors.New(msg)
	}
	return strings.TrimSuffix(out.String(), "\n"), nil
}

// ResolveRepo returns repository metadata for the given directory.
func ResolveRepo(directory string) (RepoInfo, error) {
	abs, err := filepath.Abs(filepath.Clean(directory))
	if err != nil {
		return RepoInfo{}, err
	}
	if abs == "" {
		return RepoInfo{IsRepo: false}, nil
	}

	root, err := runGit(abs, "rev-parse", "--show-toplevel")
	if err != nil {
		return RepoInfo{IsRepo: false}, nil
	}
	return RepoInfo{IsRepo: true, RepoRoot: root}, nil
}

// ListCommits returns recent commits from the repository containing directory.
func ListCommits(directory string, limit, offset int) ([]Commit, error) {
	info, err := ResolveRepo(directory)
	if err != nil {
		return nil, err
	}
	if !info.IsRepo {
		return nil, errors.New("not a git repository")
	}
	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	raw, err := runGit(
		info.RepoRoot,
		"log",
		fmt.Sprintf("-n%d", limit),
		fmt.Sprintf("--skip=%d", offset),
		`--format=%H%x1f%h%x1f%s%x1f%ai`,
	)
	if err != nil {
		return nil, err
	}
	if raw == "" {
		return []Commit{}, nil
	}

	commits := make([]Commit, 0, strings.Count(raw, "\n")+1)
	for _, line := range strings.Split(raw, "\n") {
		parts := strings.Split(line, "\x1f")
		if len(parts) != 4 {
			continue
		}
		commits = append(commits, Commit{
			Hash:      parts[0],
			ShortHash: parts[1],
			Subject:   parts[2],
			Date:      parts[3],
		})
	}
	return commits, nil
}

func scopePrefix(directory, repoRoot string) (string, error) {
	absDir, err := filepath.Abs(filepath.Clean(directory))
	if err != nil {
		return "", err
	}
	absRepo, err := filepath.Abs(filepath.Clean(repoRoot))
	if err != nil {
		return "", err
	}

	rel, err := filepath.Rel(absRepo, absDir)
	if err != nil {
		return "", err
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", errors.New("directory is outside the git repository")
	}
	if rel == "." {
		return "", nil
	}
	return toGitPath(rel) + "/", nil
}

func toGitPath(path string) string {
	return filepath.ToSlash(path)
}

// ListTableFiles returns *.table.json paths relative to directory at the given commit.
func ListTableFiles(directory, commitHash string) ([]string, error) {
	info, err := ResolveRepo(directory)
	if err != nil {
		return nil, err
	}
	if !info.IsRepo {
		return nil, errors.New("not a git repository")
	}
	if strings.TrimSpace(commitHash) == "" {
		return nil, errors.New("commit hash is required")
	}

	prefix, err := scopePrefix(directory, info.RepoRoot)
	if err != nil {
		return nil, err
	}

	raw, err := runGit(info.RepoRoot, "ls-tree", "-r", "--name-only", commitHash)
	if err != nil {
		return nil, err
	}
	if raw == "" {
		return []string{}, nil
	}

	files := make([]string, 0)
	for _, name := range strings.Split(raw, "\n") {
		if !strings.HasSuffix(name, tableJSONSuffix) {
			continue
		}
		if prefix != "" && !strings.HasPrefix(name, prefix) {
			continue
		}
		rel := strings.TrimPrefix(name, prefix)
		if rel == "" {
			continue
		}
		files = append(files, rel)
	}
	return files, nil
}

// ReadTableFile reads a *.table.json file from a commit. relPath is relative to directory.
func ReadTableFile(directory, commitHash, relPath string) (string, error) {
	info, err := ResolveRepo(directory)
	if err != nil {
		return "", err
	}
	if !info.IsRepo {
		return "", errors.New("not a git repository")
	}
	if strings.TrimSpace(commitHash) == "" {
		return "", errors.New("commit hash is required")
	}

	cleanRel := filepath.ToSlash(filepath.Clean(relPath))
	if cleanRel == "." || strings.HasPrefix(cleanRel, "../") {
		return "", errors.New("invalid relative path")
	}
	if !strings.HasSuffix(cleanRel, tableJSONSuffix) {
		return "", errors.New("not a *.table.json file")
	}

	prefix, err := scopePrefix(directory, info.RepoRoot)
	if err != nil {
		return "", err
	}

	gitPath := prefix + cleanRel
	raw, err := runGit(info.RepoRoot, "show", commitHash+":"+gitPath)
	if err != nil {
		return "", err
	}
	return raw, nil
}
