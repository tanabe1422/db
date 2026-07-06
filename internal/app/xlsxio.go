package app

import (
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"db-gui/internal/config"
	"db-gui/internal/gencli"
)

const xlsxSuffix = ".xlsx"

// XlsxImportFailure describes one failed xlsx import.
type XlsxImportFailure struct {
	SourcePath string `json:"sourcePath"`
	Message    string `json:"message"`
}

// XlsxImportResult summarizes a bulk xlsx import.
type XlsxImportResult struct {
	Imported int                 `json:"imported"`
	Failures []XlsxImportFailure `json:"failures"`
}

// WriteXlsxExport reads tableFilePath, generates xlsx via gen.exe, and writes
// under exportRoot. fallbackRelPath is used when gen.exe returns an empty relPath.
func (a *App) WriteXlsxExport(exportRoot, tableFilePath, fallbackRelPath string) error {
	tableJSON, err := a.ReadTableFile(tableFilePath)
	if err != nil {
		return err
	}

	data, relPath, err := gencli.XlsxExport([]byte(tableJSON))
	if err != nil {
		return err
	}
	if len(data) == 0 {
		return nil
	}

	if relPath == "" {
		relPath = fallbackRelPath
	}

	return a.writeExportBinaryFile(exportRoot, relPath, data)
}

func (a *App) writeExportBinaryFile(exportRoot, relativePath string, data []byte) error {
	root, err := filepath.Abs(filepath.Clean(exportRoot))
	if err != nil {
		return err
	}

	rel := filepath.FromSlash(strings.TrimPrefix(relativePath, "/"))
	if rel == "" || rel == "." {
		return nil
	}

	if err := a.EnsureExportRelDir(exportRoot, relativePath); err != nil {
		return err
	}

	target := filepath.Join(root, rel)
	return os.WriteFile(target, data, 0o644)
}

// ImportXlsxDirectory converts all *.xlsx under sourceDir and writes *.table.json into targetDir.
func (a *App) ImportXlsxDirectory(sourceDir, targetDir string) (XlsxImportResult, error) {
	sourceRoot, err := filepath.Abs(filepath.Clean(sourceDir))
	if err != nil {
		return XlsxImportResult{}, err
	}

	targetRoot, err := filepath.Abs(filepath.Clean(targetDir))
	if err != nil {
		return XlsxImportResult{}, err
	}

	sourceInfo, err := os.Stat(sourceRoot)
	if err != nil {
		return XlsxImportResult{}, err
	}
	if !sourceInfo.IsDir() {
		return XlsxImportResult{}, fs.ErrInvalid
	}

	targetInfo, err := os.Stat(targetRoot)
	if err != nil {
		return XlsxImportResult{}, err
	}
	if !targetInfo.IsDir() {
		return XlsxImportResult{}, fs.ErrInvalid
	}

	settings, err := config.Load()
	if err != nil {
		return XlsxImportResult{}, err
	}
	if !isUnderConfiguredDirectory(targetRoot, settings.Directories) {
		return XlsxImportResult{}, errors.New("path is outside the configured directories")
	}

	result := XlsxImportResult{Failures: []XlsxImportFailure{}}

	var xlsxPaths []string
	err = filepath.WalkDir(sourceRoot, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			result.Failures = append(result.Failures, XlsxImportFailure{
				SourcePath: path,
				Message:    walkErr.Error(),
			})
			return nil
		}
		if entry.IsDir() {
			return nil
		}
		if !strings.EqualFold(filepath.Ext(entry.Name()), xlsxSuffix) {
			return nil
		}
		xlsxPaths = append(xlsxPaths, path)
		return nil
	})
	if err != nil {
		return XlsxImportResult{}, err
	}

	total := len(xlsxPaths)
	for index, path := range xlsxPaths {
		label := path
		if rel, relErr := filepath.Rel(sourceRoot, path); relErr == nil {
			label = rel
		}
		a.emitGenProgress(index, total, label)

		xlsxData, err := os.ReadFile(path)
		if err != nil {
			result.Failures = append(result.Failures, XlsxImportFailure{
				SourcePath: path,
				Message:    err.Error(),
			})
			continue
		}

		tableJSON, relPath, err := gencli.XlsxImport(xlsxData)
		if err != nil {
			result.Failures = append(result.Failures, XlsxImportFailure{
				SourcePath: path,
				Message:    err.Error(),
			})
			continue
		}

		outPath, err := importOutputPath(targetRoot, sourceRoot, path, relPath)
		if err != nil {
			result.Failures = append(result.Failures, XlsxImportFailure{
				SourcePath: path,
				Message:    err.Error(),
			})
			continue
		}

		if err := a.WriteTableFile(outPath, string(tableJSON)); err != nil {
			result.Failures = append(result.Failures, XlsxImportFailure{
				SourcePath: path,
				Message:    err.Error(),
			})
			continue
		}

		result.Imported++
		a.emitGenProgress(index+1, total, label)
	}

	return result, nil
}

func importOutputPath(targetRoot, sourceRoot, xlsxPath, generatorRelPath string) (string, error) {
	if generatorRelPath != "" {
		rel := filepath.FromSlash(strings.TrimPrefix(generatorRelPath, "/"))
		return filepath.Join(targetRoot, rel), nil
	}

	rel, err := filepath.Rel(sourceRoot, xlsxPath)
	if err != nil {
		return "", err
	}

	rel = strings.TrimSuffix(rel, filepath.Ext(rel)) + tableJSONSuffix
	return filepath.Join(targetRoot, rel), nil
}
