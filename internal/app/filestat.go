package app

import (
	"errors"
	"os"
)

// FileStat holds filesystem metadata used to detect external file changes.
type FileStat struct {
	ModTimeUnixNano int64 `json:"modTimeUnixNano"`
	Size            int64 `json:"size"`
}

// GetFileStat returns modification time and size for a file under configured directories.
func (a *App) GetFileStat(path string) (FileStat, error) {
	abs, err := a.absPathUnderDirs(path)
	if err != nil {
		return FileStat{}, err
	}

	info, err := os.Stat(abs)
	if err != nil {
		return FileStat{}, err
	}
	if info.IsDir() {
		return FileStat{}, errors.New("not a file")
	}

	return FileStat{
		ModTimeUnixNano: info.ModTime().UnixNano(),
		Size:            info.Size(),
	}, nil
}

func fileStatChanged(a, b FileStat) bool {
	return a.ModTimeUnixNano != b.ModTimeUnixNano || a.Size != b.Size
}
