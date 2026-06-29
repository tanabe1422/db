package app

import (
	"testing"

	"github.com/fsnotify/fsnotify"
)

func TestIsStructuralChange(t *testing.T) {
	t.Parallel()

	cases := []struct {
		op   fsnotify.Op
		want bool
	}{
		{fsnotify.Create, true},
		{fsnotify.Remove, true},
		{fsnotify.Rename, true},
		{fsnotify.Write, false},
		{fsnotify.Chmod, false},
		{fsnotify.Create | fsnotify.Write, true},
	}

	for _, tc := range cases {
		if got := isStructuralChange(tc.op); got != tc.want {
			t.Errorf("isStructuralChange(%v) = %v, want %v", tc.op, got, tc.want)
		}
	}
}

func TestIsUnderRoot(t *testing.T) {
	t.Parallel()

	root := `C:\work\project`

	if !isUnderRoot(`C:\work\project\tables\foo.table.json`, root) {
		t.Fatal("expected path under root")
	}
	if isUnderRoot(`C:\work\other\foo.table.json`, root) {
		t.Fatal("expected path outside root")
	}
}
