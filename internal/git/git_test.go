package git

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestListTableFilesAndRead(t *testing.T) {
	repo := filepath.Join("..", "..", "examples", "git-diff-demo")
	if _, err := os.Stat(filepath.Join(repo, ".git")); err != nil {
		t.Skip("examples/git-diff-demo is not initialized; run git init setup first")
	}

	info, err := ResolveRepo(repo)
	if err != nil {
		t.Fatal(err)
	}
	if !info.IsRepo {
		t.Fatal("expected git repo")
	}

	commits, err := ListCommits(repo, 10, 0)
	if err != nil {
		t.Fatal(err)
	}
	if len(commits) < 2 {
		t.Fatalf("expected at least 2 commits, got %d", len(commits))
	}

	latest := commits[0]
	files, err := ListTableFiles(repo, latest.Hash)
	if err != nil {
		t.Fatal(err)
	}
	if len(files) == 0 {
		t.Fatal("expected table files in latest commit")
	}

	raw, err := ReadTableFile(repo, latest.Hash, files[0])
	if err != nil {
		t.Fatal(err)
	}
	if raw == "" {
		t.Fatal("expected non-empty file content")
	}
}

func TestResolveRepoNotGit(t *testing.T) {
	dir := t.TempDir()
	info, err := ResolveRepo(dir)
	if err != nil {
		t.Fatal(err)
	}
	if info.IsRepo {
		t.Fatal("expected not a repo")
	}
}

func TestGitAvailable(t *testing.T) {
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("git is not available in PATH")
	}
}
