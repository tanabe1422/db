package app

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	fileOpenEvent = "file:open"
	diffOpenEvent = "diff:open"

	launchActionOpen        = "open"
	launchActionDiffFiles   = "diff-files"
	launchActionDiffPreview = "diff-preview"

	tableDiffSuffix = ".table-diff.json"
)

// LaunchAction describes a file open or diff preview request from CLI / OS.
type LaunchAction struct {
	Type  string   `json:"type"`
	Paths []string `json:"paths,omitempty"`
	Label string   `json:"label,omitempty"`
	Left  string   `json:"left,omitempty"`
	Right string   `json:"right,omitempty"`
}

type diffPreviewManifest struct {
	Label string          `json:"label"`
	Left  json.RawMessage `json:"left"`
	Right json.RawMessage `json:"right"`
}

func parseLaunchActions(args []string) ([]LaunchAction, error) {
	var actions []LaunchAction

	for i := 0; i < len(args); i++ {
		arg := strings.TrimSpace(args[i])
		if arg == "" {
			continue
		}

		switch arg {
		case "--diff-preview":
			i++
			if i >= len(args) {
				return nil, errors.New("--diff-preview requires a file path")
			}
			action, err := loadDiffPreviewAction(args[i])
			if err != nil {
				return nil, err
			}
			actions = append(actions, action)

		case "--diff":
			i++
			if i+1 >= len(args) {
				return nil, errors.New("--diff requires two file paths")
			}
			left, err := absTableJSONPath(args[i])
			if err != nil {
				return nil, err
			}
			right, err := absTableJSONPath(args[i+1])
			if err != nil {
				return nil, err
			}
			actions = append(actions, LaunchAction{
				Type:  launchActionDiffFiles,
				Paths: []string{left, right},
			})
			i++

		default:
			path, err := absTableJSONPath(arg)
			if err != nil {
				continue
			}
			actions = append(actions, LaunchAction{
				Type:  launchActionOpen,
				Paths: []string{path},
			})
		}
	}

	return actions, nil
}

func absTableJSONPath(path string) (string, error) {
	abs, err := filepath.Abs(filepath.Clean(strings.TrimSpace(path)))
	if err != nil {
		return "", err
	}
	if !strings.HasSuffix(strings.ToLower(abs), tableJSONSuffix) {
		return "", errors.New("not a *.table.json file")
	}
	return abs, nil
}

func absTableDiffPath(path string) (string, error) {
	abs, err := filepath.Abs(filepath.Clean(strings.TrimSpace(path)))
	if err != nil {
		return "", err
	}
	if !strings.HasSuffix(strings.ToLower(abs), tableDiffSuffix) {
		return "", errors.New("not a *.table-diff.json file")
	}
	return abs, nil
}

func loadDiffPreviewAction(path string) (LaunchAction, error) {
	abs, err := absTableDiffPath(path)
	if err != nil {
		return LaunchAction{}, err
	}

	data, err := os.ReadFile(abs)
	if err != nil {
		return LaunchAction{}, err
	}

	var manifest diffPreviewManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		return LaunchAction{}, err
	}
	if len(manifest.Left) == 0 || len(manifest.Right) == 0 {
		return LaunchAction{}, errors.New("diff preview manifest requires left and right")
	}

	label := strings.TrimSpace(manifest.Label)
	if label == "" {
		label = filepath.Base(abs)
	}

	return LaunchAction{
		Type:  launchActionDiffPreview,
		Label: label,
		Left:  string(manifest.Left),
		Right: string(manifest.Right),
	}, nil
}

func (a *App) captureLaunchArgs(args []string) {
	actions, err := parseLaunchActions(args)
	if err != nil || len(actions) == 0 {
		return
	}

	a.launchMu.Lock()
	a.pendingLaunchActions = append(a.pendingLaunchActions, actions...)
	a.launchMu.Unlock()
}

// OnSecondInstanceLaunch handles a second app launch (e.g. opening a file from Explorer).
func (a *App) OnSecondInstanceLaunch(secondInstanceData options.SecondInstanceData) {
	a.emitLaunchActions(secondInstanceData.Args)
}

func (a *App) emitLaunchActions(args []string) {
	actions, err := parseLaunchActions(args)
	if err != nil || len(actions) == 0 || a.ctx == nil {
		return
	}

	runtime.WindowUnminimise(a.ctx)
	runtime.Show(a.ctx)

	for _, action := range actions {
		action := action
		switch action.Type {
		case launchActionOpen:
			if len(action.Paths) == 0 {
				continue
			}
			path := action.Paths[0]
			go runtime.EventsEmit(a.ctx, fileOpenEvent, path)
		case launchActionDiffFiles, launchActionDiffPreview:
			go runtime.EventsEmit(a.ctx, diffOpenEvent, action)
		}
	}
}

// GetLaunchActions returns and clears actions passed on first launch via CLI arguments.
func (a *App) GetLaunchActions() []LaunchAction {
	a.launchMu.Lock()
	defer a.launchMu.Unlock()

	pending := a.pendingLaunchActions
	a.pendingLaunchActions = nil
	return pending
}
