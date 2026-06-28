package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestAddRemoveAndActiveDirectory(t *testing.T) {
	dirA := filepath.Join(t.TempDir(), "project-a")
	dirB := filepath.Join(t.TempDir(), "project-b")
	if err := os.MkdirAll(dirA, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(dirB, 0o755); err != nil {
		t.Fatal(err)
	}

	settings, err := AddDirectory(Settings{}, dirA)
	if err != nil {
		t.Fatal(err)
	}
	if settings.ActiveDirectory != dirA {
		t.Fatalf("expected active %s, got %s", dirA, settings.ActiveDirectory)
	}

	settings, err = AddDirectory(settings, dirB)
	if err != nil {
		t.Fatal(err)
	}
	if len(settings.Directories) != 2 {
		t.Fatalf("expected 2 directories, got %d", len(settings.Directories))
	}
	if settings.Directories[0] != dirA || settings.Directories[1] != dirB {
		t.Fatalf("expected append order [%s, %s], got %v", dirA, dirB, settings.Directories)
	}

	settings, err = SetActiveDirectory(settings, dirB)
	if err != nil {
		t.Fatal(err)
	}
	if settings.ActiveDirectory != dirB {
		t.Fatalf("expected active %s, got %s", dirB, settings.ActiveDirectory)
	}
	if settings.Directories[0] != dirA || settings.Directories[1] != dirB {
		t.Fatalf("expected order unchanged after activation, got %v", settings.Directories)
	}

	settings, err = RemoveDirectory(settings, dirB)
	if err != nil {
		t.Fatal(err)
	}
	if settings.ActiveDirectory != dirA {
		t.Fatalf("expected active fallback %s, got %s", dirA, settings.ActiveDirectory)
	}
}

func TestMoveDirectory(t *testing.T) {
	dirA := filepath.Join(t.TempDir(), "project-a")
	dirB := filepath.Join(t.TempDir(), "project-b")
	dirC := filepath.Join(t.TempDir(), "project-c")
	for _, dir := range []string{dirA, dirB, dirC} {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			t.Fatal(err)
		}
	}

	settings, err := AddDirectory(Settings{}, dirA)
	if err != nil {
		t.Fatal(err)
	}
	settings, err = AddDirectory(settings, dirB)
	if err != nil {
		t.Fatal(err)
	}
	settings, err = AddDirectory(settings, dirC)
	if err != nil {
		t.Fatal(err)
	}
	if settings.Directories[0] != dirA || settings.Directories[2] != dirC {
		t.Fatalf("expected append order [%s, %s, %s], got %v", dirA, dirB, dirC, settings.Directories)
	}

	settings, err = MoveDirectory(settings, dirC, -1)
	if err != nil {
		t.Fatal(err)
	}
	if settings.Directories[1] != dirC {
		t.Fatalf("expected %s at index 1 after move up, got %v", dirC, settings.Directories)
	}

	settings, err = MoveDirectory(settings, dirA, 1)
	if err != nil {
		t.Fatal(err)
	}
	if settings.Directories[1] != dirA {
		t.Fatalf("expected %s at index 1 after move down, got %v", dirA, settings.Directories)
	}

	settings, err = AddDirectory(settings, dirB)
	if err != nil {
		t.Fatal(err)
	}
	if settings.Directories[1] != dirA {
		t.Fatalf("expected order unchanged after re-add, got %v", settings.Directories)
	}
	if len(settings.Directories) != 3 {
		t.Fatalf("expected 3 directories after re-add, got %d", len(settings.Directories))
	}
	if settings.ActiveDirectory != dirB {
		t.Fatalf("expected active %s after re-add, got %s", dirB, settings.ActiveDirectory)
	}
}
