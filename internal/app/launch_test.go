package app

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParseLaunchActionsOpen(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	valid := filepath.Join(dir, "users.table.json")
	if err := os.WriteFile(valid, []byte(`{}`), 0o644); err != nil {
		t.Fatal(err)
	}

	actions, err := parseLaunchActions([]string{
		valid,
		`C:\other\missing.table.json`,
		`C:\bad.txt`,
	})
	if err != nil {
		t.Fatal(err)
	}

	if len(actions) != 2 {
		t.Fatalf("expected 2 actions, got %d: %v", len(actions), actions)
	}
	if actions[0].Type != launchActionOpen || actions[0].Paths[0] != valid {
		t.Fatalf("unexpected first action: %+v", actions[0])
	}
}

func TestParseLaunchActionsDiffFiles(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	left := filepath.Join(dir, "before.table.json")
	right := filepath.Join(dir, "after.table.json")

	actions, err := parseLaunchActions([]string{"--diff", left, right})
	if err != nil {
		t.Fatal(err)
	}
	if len(actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(actions))
	}
	if actions[0].Type != launchActionDiffFiles {
		t.Fatalf("unexpected type: %s", actions[0].Type)
	}
	if len(actions[0].Paths) != 2 {
		t.Fatalf("expected 2 paths, got %d", len(actions[0].Paths))
	}
}

func TestParseLaunchActionsDiffPreview(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	manifest := filepath.Join(dir, "preview.table-diff.json")
	content := `{
		"label": "users.table.json",
		"left": {"tableName":"users","columns":[]},
		"right": {"tableName":"users","columns":[{"name":"id"}]}
	}`
	if err := os.WriteFile(manifest, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}

	actions, err := parseLaunchActions([]string{"--diff-preview", manifest})
	if err != nil {
		t.Fatal(err)
	}
	if len(actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(actions))
	}
	action := actions[0]
	if action.Type != launchActionDiffPreview {
		t.Fatalf("unexpected type: %s", action.Type)
	}
	if action.Label != "users.table.json" {
		t.Fatalf("unexpected label: %q", action.Label)
	}
	if action.Left == "" || action.Right == "" {
		t.Fatal("expected left and right JSON")
	}
}

func TestGrantExternalFileAllowsReadWrite(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	path := filepath.Join(dir, "users.table.json")
	if err := os.WriteFile(path, []byte(`{"tableName":"users"}`), 0o644); err != nil {
		t.Fatal(err)
	}

	app := New()
	if err := app.GrantExternalFile(path); err != nil {
		t.Fatal(err)
	}

	content, err := app.ReadTableFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if content != `{"tableName":"users"}` {
		t.Fatalf("unexpected content: %q", content)
	}

	updated := `{"tableName":"users","columns":[]}`
	if err := app.WriteTableFile(path, updated); err != nil {
		t.Fatal(err)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != updated {
		t.Fatalf("unexpected file content: %q", data)
	}
}

func TestGetLaunchActionsClearsPending(t *testing.T) {
	t.Parallel()

	app := New()
	app.pendingLaunchActions = []LaunchAction{
		{Type: launchActionOpen, Paths: []string{`C:\a.table.json`}},
	}

	got := app.GetLaunchActions()
	if len(got) != 1 || got[0].Paths[0] != `C:\a.table.json` {
		t.Fatalf("unexpected first result: %v", got)
	}
	if len(app.GetLaunchActions()) != 0 {
		t.Fatal("expected pending actions to be cleared")
	}
}
