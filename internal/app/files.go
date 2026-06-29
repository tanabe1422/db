package app

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"db-gui/internal/config"
)

func (a *App) absPathUnderDirs(path string) (string, error) {
	abs, err := filepath.Abs(filepath.Clean(path))
	if err != nil {
		return "", err
	}

	settings, err := config.Load()
	if err != nil {
		return "", err
	}

	if !isUnderConfiguredDirectory(abs, settings.Directories) {
		return "", errors.New("path is outside the configured directories")
	}

	return abs, nil
}

func validateBaseName(name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return errors.New("name is required")
	}
	if strings.ContainsAny(name, `/\`) {
		return errors.New("name must not contain path separators")
	}
	return nil
}

func splitFileName(baseName string) (stem, ext string) {
	if strings.HasSuffix(strings.ToLower(baseName), tableJSONSuffix) {
		return baseName[:len(baseName)-len(tableJSONSuffix)], tableJSONSuffix
	}
	ext = filepath.Ext(baseName)
	stem = strings.TrimSuffix(baseName, ext)
	return stem, ext
}

func copyVariantName(stem, ext string, n int) string {
	if n == 1 {
		return stem + " copy" + ext
	}
	return fmt.Sprintf("%s copy %d%s", stem, n, ext)
}

func uniqueDestPath(dir, baseName string) (string, error) {
	candidate := filepath.Join(dir, baseName)
	if _, err := os.Stat(candidate); os.IsNotExist(err) {
		return candidate, nil
	} else if err != nil {
		return "", err
	}

	stem, ext := splitFileName(baseName)
	for i := 1; ; i++ {
		candidate = filepath.Join(dir, copyVariantName(stem, ext, i))
		if _, err := os.Stat(candidate); os.IsNotExist(err) {
			return candidate, nil
		} else if err != nil {
			return "", err
		}
	}
}

func newTableJSONContent(tableName string, schemaRef string) (string, error) {
	payload := map[string]any{
		"schemaVersion": 1,
		"name":          tableName,
		"columns": []map[string]any{
			{
				"name":     "id",
				"dataType": "bigint",
				"notNull":  true,
			},
		},
	}
	if schemaRef != "" {
		payload["$schema"] = schemaRef
	}
	data, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data) + "\n", nil
}

func normalizeTableFileName(tableName string) (string, string, error) {
	tableName = strings.TrimSpace(tableName)
	if tableName == "" {
		return "", "", errors.New("table name is required")
	}

	base := filepath.Base(tableName)
	if strings.ContainsAny(base, `/\`) {
		return "", "", errors.New("table name must not contain path separators")
	}

	fileName := base
	if !strings.HasSuffix(strings.ToLower(fileName), tableJSONSuffix) {
		fileName = base + tableJSONSuffix
	}

	logicalName := strings.TrimSuffix(fileName, tableJSONSuffix)
	if logicalName == "" {
		return "", "", errors.New("table name is required")
	}

	return fileName, logicalName, nil
}

// CreateDirectory creates a subdirectory under parentDir.
func (a *App) CreateDirectory(parentDir, name string) error {
	if err := validateBaseName(name); err != nil {
		return err
	}

	parent, err := a.absPathUnderDirs(parentDir)
	if err != nil {
		return err
	}

	info, err := os.Stat(parent)
	if err != nil {
		return err
	}
	if !info.IsDir() {
		return errors.New("parent is not a directory")
	}

	dest := filepath.Join(parent, name)
	if _, err := os.Stat(dest); err == nil {
		return fmt.Errorf("%s already exists", name)
	} else if !os.IsNotExist(err) {
		return err
	}

	return os.Mkdir(dest, 0o755)
}

// CreateTableJSONFile creates a new *.table.json file under parentDir.
func (a *App) CreateTableJSONFile(parentDir, tableName string) (string, error) {
	fileName, logicalName, err := normalizeTableFileName(tableName)
	if err != nil {
		return "", err
	}

	parent, err := a.absPathUnderDirs(parentDir)
	if err != nil {
		return "", err
	}

	info, err := os.Stat(parent)
	if err != nil {
		return "", err
	}
	if !info.IsDir() {
		return "", errors.New("parent is not a directory")
	}

	dest := filepath.Join(parent, fileName)
	if _, err := os.Stat(dest); err == nil {
		return "", fmt.Errorf("%s already exists", fileName)
	} else if !os.IsNotExist(err) {
		return "", err
	}

	settings, err := config.Load()
	if err != nil {
		return "", err
	}
	schemaRef := schemaRefIfPresent(parent, settings.Directories)

	content, err := newTableJSONContent(logicalName, schemaRef)
	if err != nil {
		return "", err
	}

	if err := os.WriteFile(dest, []byte(content), 0o644); err != nil {
		return "", err
	}

	return dest, nil
}

// RenameEntry renames a file or directory to newName (basename only).
func (a *App) RenameEntry(path, newName string) error {
	if err := validateBaseName(newName); err != nil {
		return err
	}

	abs, err := a.absPathUnderDirs(path)
	if err != nil {
		return err
	}

	info, err := os.Stat(abs)
	if err != nil {
		return err
	}

	if !info.IsDir() && !strings.HasSuffix(abs, tableJSONSuffix) {
		return errors.New("only *.table.json files can be renamed")
	}

	dest := filepath.Join(filepath.Dir(abs), newName)
	if strings.EqualFold(abs, dest) {
		return nil
	}

	if _, err := os.Stat(dest); err == nil {
		return fmt.Errorf("%s already exists", newName)
	} else if !os.IsNotExist(err) {
		return err
	}

	return os.Rename(abs, dest)
}

// DeleteFile removes a *.table.json file.
func (a *App) DeleteFile(path string) error {
	abs, err := a.absPathUnderDirs(path)
	if err != nil {
		return err
	}

	if !strings.HasSuffix(abs, tableJSONSuffix) {
		return errors.New("only *.table.json files can be deleted")
	}

	info, err := os.Stat(abs)
	if err != nil {
		return err
	}
	if info.IsDir() {
		return errors.New("only files can be deleted")
	}

	return os.Remove(abs)
}

// CopyFile copies a *.table.json file into destDir.
func (a *App) CopyFile(srcPath, destDir string) (string, error) {
	src, err := a.absPathUnderDirs(srcPath)
	if err != nil {
		return "", err
	}

	if !strings.HasSuffix(src, tableJSONSuffix) {
		return "", errors.New("only *.table.json files can be copied")
	}

	info, err := os.Stat(src)
	if err != nil {
		return "", err
	}
	if info.IsDir() {
		return "", errors.New("only files can be copied")
	}

	destParent, err := a.absPathUnderDirs(destDir)
	if err != nil {
		return "", err
	}

	parentInfo, err := os.Stat(destParent)
	if err != nil {
		return "", err
	}
	if !parentInfo.IsDir() {
		return "", errors.New("destination is not a directory")
	}

	dest, err := uniqueDestPath(destParent, filepath.Base(src))
	if err != nil {
		return "", err
	}

	in, err := os.Open(src)
	if err != nil {
		return "", err
	}
	defer in.Close()

	out, err := os.OpenFile(dest, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return "", err
	}
	defer out.Close()

	if _, err := io.Copy(out, in); err != nil {
		return "", err
	}

	return dest, nil
}

// MoveFile moves a *.table.json file into destDir.
func (a *App) MoveFile(srcPath, destDir string) (string, error) {
	src, err := a.absPathUnderDirs(srcPath)
	if err != nil {
		return "", err
	}

	if !strings.HasSuffix(src, tableJSONSuffix) {
		return "", errors.New("only *.table.json files can be moved")
	}

	info, err := os.Stat(src)
	if err != nil {
		return "", err
	}
	if info.IsDir() {
		return "", errors.New("only files can be moved")
	}

	destParent, err := a.absPathUnderDirs(destDir)
	if err != nil {
		return "", err
	}

	parentInfo, err := os.Stat(destParent)
	if err != nil {
		return "", err
	}
	if !parentInfo.IsDir() {
		return "", errors.New("destination is not a directory")
	}

	dest := filepath.Join(destParent, filepath.Base(src))
	if strings.EqualFold(filepath.Dir(src), destParent) {
		return src, nil
	}

	if _, err := os.Stat(dest); err == nil {
		var uniqueErr error
		dest, uniqueErr = uniqueDestPath(destParent, filepath.Base(src))
		if uniqueErr != nil {
			return "", uniqueErr
		}
	} else if !os.IsNotExist(err) {
		return "", err
	}

	if err := os.Rename(src, dest); err != nil {
		return "", err
	}

	return dest, nil
}
