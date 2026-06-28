package config

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

type Settings struct {
	Directories     []string `json:"directories"`
	ActiveDirectory string   `json:"activeDirectory"`
}

func configPath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "db-gui", "config.json"), nil
}

func normalizePath(path string) (string, error) {
	if path == "" {
		return "", nil
	}
	abs, err := filepath.Abs(filepath.Clean(path))
	if err != nil {
		return "", err
	}
	return abs, nil
}

func Load() (Settings, error) {
	path, err := configPath()
	if err != nil {
		return Settings{}, err
	}

	data, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return normalizeSettings(Settings{})
	}
	if err != nil {
		return Settings{}, err
	}

	var settings Settings
	if err := json.Unmarshal(data, &settings); err != nil {
		return Settings{}, err
	}

	return normalizeSettings(settings)
}

func Save(settings Settings) error {
	normalized, err := normalizeSettings(settings)
	if err != nil {
		return err
	}

	path, err := configPath()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(normalized, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0o644)
}

func normalizeSettings(settings Settings) (Settings, error) {
	seen := make(map[string]struct{})
	directories := make([]string, 0, len(settings.Directories))

	for _, dir := range settings.Directories {
		normalized, err := normalizePath(dir)
		if err != nil {
			return Settings{}, err
		}
		if normalized == "" {
			continue
		}
		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}
		directories = append(directories, normalized)
	}

	active, err := normalizePath(settings.ActiveDirectory)
	if err != nil {
		return Settings{}, err
	}

	activeStillExists := false
	for _, dir := range directories {
		if dir == active {
			activeStillExists = true
			break
		}
	}

	if !activeStillExists {
		if len(directories) > 0 {
			active = directories[0]
		} else {
			active = ""
		}
	}

	return Settings{
		Directories:     directories,
		ActiveDirectory: active,
	}, nil
}

func touchDirectory(directories []string, path string) []string {
	filtered := make([]string, 0, len(directories))
	for _, dir := range directories {
		if dir != path {
			filtered = append(filtered, dir)
		}
	}
	return append([]string{path}, filtered...)
}

func AddDirectory(settings Settings, path string) (Settings, error) {
	normalized, err := normalizePath(path)
	if err != nil {
		return Settings{}, err
	}
	if normalized == "" {
		return settings, nil
	}

	settings.Directories = touchDirectory(settings.Directories, normalized)
	settings.ActiveDirectory = normalized

	return normalizeSettings(settings)
}

func RemoveDirectory(settings Settings, path string) (Settings, error) {
	normalized, err := normalizePath(path)
	if err != nil {
		return Settings{}, err
	}

	filtered := make([]string, 0, len(settings.Directories))
	for _, dir := range settings.Directories {
		if dir != normalized {
			filtered = append(filtered, dir)
		}
	}
	settings.Directories = filtered

	if settings.ActiveDirectory == normalized {
		settings.ActiveDirectory = ""
	}

	return normalizeSettings(settings)
}

func SetActiveDirectory(settings Settings, path string) (Settings, error) {
	normalized, err := normalizePath(path)
	if err != nil {
		return Settings{}, err
	}

	for _, dir := range settings.Directories {
		if dir == normalized {
			settings.ActiveDirectory = normalized
			settings.Directories = touchDirectory(settings.Directories, normalized)
			return normalizeSettings(settings)
		}
	}

	return normalizeSettings(settings)
}
