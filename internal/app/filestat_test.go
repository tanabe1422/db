package app

import "testing"

func TestFileStatChanged(t *testing.T) {
	base := FileStat{ModTimeUnixNano: 100, Size: 10}

	if fileStatChanged(base, FileStat{ModTimeUnixNano: 100, Size: 10}) {
		t.Fatal("expected identical stats to be unchanged")
	}
	if !fileStatChanged(base, FileStat{ModTimeUnixNano: 101, Size: 10}) {
		t.Fatal("expected mod time change to be detected")
	}
	if !fileStatChanged(base, FileStat{ModTimeUnixNano: 100, Size: 11}) {
		t.Fatal("expected size change to be detected")
	}
}
