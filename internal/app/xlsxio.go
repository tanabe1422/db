package app

import (
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"db-gui/internal/config"
	"db-gui/internal/sqlgen"
)

const xlsxSuffix = ".xlsx"

// XlsxExportResult is the output of xlsx export generation.
type XlsxExportResult struct {
	Data    []byte `json:"data"`
	RelPath string `json:"relPath"`
}

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

// GenerateXlsxExport turns one *.table.json into xlsx bytes via the private implementation.
func (a *App) GenerateXlsxExport(tableJSON string) (XlsxExportResult, error) {
	gen, err := sqlgen.NewXlsxExport()
	if err != nil {
		return XlsxExportResult{}, err
	}

	data, relPath, err := gen.Generate([]byte(tableJSON))
	if err != nil {
		return XlsxExportResult{}, err
	}

	return XlsxExportResult{Data: data, RelPath: relPath}, nil
}

// WriteExportBinaryFile writes a binary file under exportRoot at relativePath.
func (a *App) WriteExportBinaryFile(exportRoot, relativePath string, data []byte) error {
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

	gen, err := sqlgen.NewXlsxImport()
	if err != nil {
		return XlsxImportResult{}, err
	}

	result := XlsxImportResult{Failures: []XlsxImportFailure{}}

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

		xlsxData, err := os.ReadFile(path)
		if err != nil {
			result.Failures = append(result.Failures, XlsxImportFailure{
				SourcePath: path,
				Message:    err.Error(),
			})
			return nil
		}

		tableJSON, relPath, err := gen.Generate(xlsxData)
		if err != nil {
			result.Failures = append(result.Failures, XlsxImportFailure{
				SourcePath: path,
				Message:    err.Error(),
			})
			return nil
		}

		outPath, err := importOutputPath(targetRoot, sourceRoot, path, relPath)
		if err != nil {
			result.Failures = append(result.Failures, XlsxImportFailure{
				SourcePath: path,
				Message:    err.Error(),
			})
			return nil
		}

		if err := a.WriteTableFile(outPath, string(tableJSON)); err != nil {
			result.Failures = append(result.Failures, XlsxImportFailure{
				SourcePath: path,
				Message:    err.Error(),
			})
			return nil
		}

		result.Imported++
		return nil
	})
	if err != nil {
		return XlsxImportResult{}, err
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
