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

func TestListCommitsFiltersTableJSONOnly(t *testing.T) {
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("git is not available in PATH")
	}

	dir := t.TempDir()
	run := func(args ...string) {
		t.Helper()
		cmd := exec.Command("git", args...)
		cmd.Dir = dir
		out, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("git %v: %v\n%s", args, err, out)
		}
	}

	run("init", "-b", "main")
	run("config", "user.email", "test@example.com")
	run("config", "user.name", "test")

	if err := os.WriteFile(filepath.Join(dir, "users.table.json"), []byte(`{"name":"users"}`), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "README.md"), []byte("# demo"), 0o644); err != nil {
		t.Fatal(err)
	}
	run("add", "users.table.json", "README.md")
	run("commit", "-m", "add users table")

	if err := os.WriteFile(filepath.Join(dir, "README.md"), []byte("# demo updated"), 0o644); err != nil {
		t.Fatal(err)
	}
	run("add", "README.md")
	run("commit", "-m", "update readme only")

	commits, err := ListCommits(dir, 10, 0)
	if err != nil {
		t.Fatal(err)
	}
	if len(commits) != 1 {
		t.Fatalf("expected 1 table.json commit, got %d", len(commits))
	}
	if commits[0].Subject != "add users table" {
		t.Fatalf("unexpected subject %q", commits[0].Subject)
	}
}
