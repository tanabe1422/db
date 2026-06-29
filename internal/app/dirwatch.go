package app

import (
	"context"
	"errors"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	directoryChangedEvent  = "directory:changed"
	directoryWatchDebounce = 300 * time.Millisecond
)

// StartDirectoryWatch watches path recursively for structural filesystem changes
// (create, remove, rename). Pass an empty path to stop watching.
func (a *App) StartDirectoryWatch(path string) error {
	a.watchMu.Lock()
	defer a.watchMu.Unlock()

	if a.watchCancel != nil {
		a.watchCancel()
		a.watchCancel = nil
	}

	if path == "" || a.ctx == nil {
		return nil
	}

	abs, err := filepath.Abs(filepath.Clean(path))
	if err != nil {
		return err
	}

	info, err := os.Stat(abs)
	if err != nil {
		return err
	}
	if !info.IsDir() {
		return errors.New("not a directory")
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}

	if err := addDirWatchRecursive(watcher, abs); err != nil {
		_ = watcher.Close()
		return err
	}

	ctx, cancel := context.WithCancel(a.ctx)
	a.watchCancel = cancel

	go a.runDirectoryWatcher(ctx, watcher, abs)
	return nil
}

func (a *App) runDirectoryWatcher(ctx context.Context, watcher *fsnotify.Watcher, root string) {
	defer watcher.Close()

	var (
		emitMu   sync.Mutex
		debounce *time.Timer
	)

	scheduleEmit := func() {
		if a.ctx == nil {
			return
		}
		emitMu.Lock()
		defer emitMu.Unlock()
		if debounce != nil {
			debounce.Stop()
		}
		debounce = time.AfterFunc(directoryWatchDebounce, func() {
			runtime.EventsEmit(a.ctx, directoryChangedEvent)
		})
	}

	for {
		select {
		case <-ctx.Done():
			emitMu.Lock()
			if debounce != nil {
				debounce.Stop()
			}
			emitMu.Unlock()
			return
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			if !isUnderRoot(event.Name, root) {
				continue
			}
			if event.Op&fsnotify.Create != 0 {
				if info, err := os.Stat(event.Name); err == nil && info.IsDir() {
					_ = addDirWatchRecursive(watcher, event.Name)
				}
			}
			if isStructuralChange(event.Op) {
				scheduleEmit()
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			log.Printf("dirwatch: %v", err)
		}
	}
}

func addDirWatchRecursive(watcher *fsnotify.Watcher, root string) error {
	return filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if !d.IsDir() {
			return nil
		}
		if addErr := watcher.Add(path); addErr != nil {
			log.Printf("dirwatch: add %s: %v", path, addErr)
		}
		return nil
	})
}

func isStructuralChange(op fsnotify.Op) bool {
	return op&(fsnotify.Create|fsnotify.Remove|fsnotify.Rename) != 0
}

func isUnderRoot(path, root string) bool {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return false
	}
	return rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}

func (a *App) stopDirectoryWatch() {
	a.watchMu.Lock()
	defer a.watchMu.Unlock()
	if a.watchCancel != nil {
		a.watchCancel()
		a.watchCancel = nil
	}
}
