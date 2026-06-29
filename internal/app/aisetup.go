package app

import (
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"db-gui/schema"
)

//go:embed templates/table-json.mdc
var cursorRuleTemplate []byte

//go:embed templates/CLAUDE.md
var claudeMDTemplate []byte

const (
	schemaRelDir       = "schema"
	schemaFileName     = "table.definition.schema.json"
	cursorRuleRelPath  = ".cursor/rules/table-json.mdc"
	claudeMDFileName   = "CLAUDE.md"
	vscodeSettingsDir  = ".vscode"
	vscodeSettingsFile = "settings.json"
)

// AISetupResult summarizes InitAISetup actions.
type AISetupResult struct {
	SchemaWritten         bool     `json:"schemaWritten"`
	CursorRuleWritten     bool     `json:"cursorRuleWritten"`
	ClaudeMDWritten       bool     `json:"claudeMdWritten"`
	VscodeSettingsWritten bool     `json:"vscodeSettingsWritten"`
	TableJSONPatched      int      `json:"tableJsonPatched"`
	TableJSONSkipped      int      `json:"tableJsonSkipped"`
	TableJSONFailed       int      `json:"tableJsonFailed"`
	Warnings              []string `json:"warnings"`
}

// InitAISetup prepares a project directory for AI-assisted editing (Cursor / Claude).
func (a *App) InitAISetup(activeDirectory string) (AISetupResult, error) {
	root, err := a.absPathUnderDirs(activeDirectory)
	if err != nil {
		return AISetupResult{}, err
	}

	info, err := os.Stat(root)
	if err != nil {
		return AISetupResult{}, err
	}
	if !info.IsDir() {
		return AISetupResult{}, errors.New("not a directory")
	}

	return initAISetup(root)
}

func initAISetup(root string) (AISetupResult, error) {
	result := AISetupResult{
		Warnings: []string{},
	}
	var err error

	result.SchemaWritten, err = writeSchemaFile(root)
	if err != nil {
		return AISetupResult{}, err
	}

	result.CursorRuleWritten, err = writeCursorRule(root)
	if err != nil {
		return AISetupResult{}, err
	}

	result.ClaudeMDWritten, err = writeClaudeMD(root)
	if err != nil {
		return AISetupResult{}, err
	}

	result.VscodeSettingsWritten, err = writeVSCodeSettings(root)
	if err != nil {
		return AISetupResult{}, err
	}

	if err := walkTableJSONFiles(root, func(path string) error {
		patched, patchErr := patchTableJSONSchema(path, root)
		if patchErr != nil {
			result.TableJSONFailed++
			result.Warnings = append(result.Warnings, patchErr.Error())
			return nil
		}
		if patched {
			result.TableJSONPatched++
		} else {
			result.TableJSONSkipped++
		}
		return nil
	}); err != nil {
		return AISetupResult{}, err
	}

	return result, nil
}

func writeSchemaFile(root string) (bool, error) {
	dest := filepath.Join(root, schemaRelDir, schemaFileName)
	if _, err := os.Stat(dest); err == nil {
		return false, nil
	} else if !os.IsNotExist(err) {
		return false, err
	}

	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return false, err
	}
	if err := os.WriteFile(dest, schema.TableDefinitionJSON, 0o644); err != nil {
		return false, err
	}
	return true, nil
}

func writeCursorRule(root string) (bool, error) {
	dest := filepath.Join(root, filepath.FromSlash(cursorRuleRelPath))
	if _, err := os.Stat(dest); err == nil {
		return false, nil
	} else if !os.IsNotExist(err) {
		return false, err
	}

	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return false, err
	}
	if err := os.WriteFile(dest, cursorRuleTemplate, 0o644); err != nil {
		return false, err
	}
	return true, nil
}

func writeClaudeMD(root string) (bool, error) {
	dest := filepath.Join(root, claudeMDFileName)
	if _, err := os.Stat(dest); err == nil {
		return false, nil
	} else if !os.IsNotExist(err) {
		return false, err
	}

	if err := os.WriteFile(dest, claudeMDTemplate, 0o644); err != nil {
		return false, err
	}
	return true, nil
}

func writeVSCodeSettings(root string) (bool, error) {
	dest := filepath.Join(root, vscodeSettingsDir, vscodeSettingsFile)

	schemaEntry := map[string]any{
		"fileMatch": []string{"*.table.json"},
		"url":       "./schema/table.definition.schema.json",
	}

	if _, err := os.Stat(dest); os.IsNotExist(err) {
		payload := map[string]any{
			"json.schemas": []any{schemaEntry},
		}
		data, err := json.MarshalIndent(payload, "", "  ")
		if err != nil {
			return false, err
		}
		if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
			return false, err
		}
		if err := os.WriteFile(dest, append(data, '\n'), 0o644); err != nil {
			return false, err
		}
		return true, nil
	} else if err != nil {
		return false, err
	}

	data, err := os.ReadFile(dest)
	if err != nil {
		return false, err
	}

	var settings map[string]any
	if len(strings.TrimSpace(string(data))) > 0 {
		if err := json.Unmarshal(data, &settings); err != nil {
			return false, fmt.Errorf("%s: invalid JSON: %w", dest, err)
		}
	} else {
		settings = map[string]any{}
	}

	schemas, ok := settings["json.schemas"].([]any)
	if !ok {
		schemas = []any{}
	}

	for _, item := range schemas {
		entry, ok := item.(map[string]any)
		if !ok {
			continue
		}
		url, _ := entry["url"].(string)
		if url == "./schema/table.definition.schema.json" {
			return false, nil
		}
	}

	settings["json.schemas"] = append(schemas, schemaEntry)
	out, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return false, err
	}
	if err := os.WriteFile(dest, append(out, '\n'), 0o644); err != nil {
		return false, err
	}
	return true, nil
}

func walkTableJSONFiles(root string, fn func(path string) error) error {
	return filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if !strings.HasSuffix(d.Name(), tableJSONSuffix) {
			return nil
		}
		return fn(path)
	})
}

func schemaRefForFile(filePath, projectRoot string) string {
	schemaPath := filepath.Join(projectRoot, schemaRelDir, schemaFileName)
	fileDir := filepath.Dir(filePath)
	rel, err := filepath.Rel(fileDir, schemaPath)
	if err != nil {
		return ""
	}
	return filepath.ToSlash(rel)
}

func patchTableJSONSchema(filePath, projectRoot string) (bool, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return false, err
	}

	if len(strings.TrimSpace(string(data))) == 0 {
		return false, fmt.Errorf("%s: empty file", relPathForDisplay(filePath, projectRoot))
	}

	var doc map[string]any
	if err := json.Unmarshal(data, &doc); err != nil {
		return false, fmt.Errorf("%s: invalid JSON: %w", relPathForDisplay(filePath, projectRoot), err)
	}

	if existing, ok := doc["$schema"].(string); ok && strings.TrimSpace(existing) != "" {
		return false, nil
	}

	ref := schemaRefForFile(filePath, projectRoot)
	if ref == "" {
		return false, fmt.Errorf("%s: cannot compute $schema path", relPathForDisplay(filePath, projectRoot))
	}

	doc["$schema"] = ref
	out, err := json.MarshalIndent(doc, "", "  ")
	if err != nil {
		return false, err
	}
	return true, os.WriteFile(filePath, append(out, '\n'), 0o644)
}

func containingDirectory(target string, directories []string) string {
	absTarget, err := filepath.Abs(filepath.Clean(target))
	if err != nil {
		return ""
	}

	var best string
	for _, dir := range directories {
		if dir == "" {
			continue
		}
		absDir, err := filepath.Abs(filepath.Clean(dir))
		if err != nil {
			continue
		}
		rel, err := filepath.Rel(absDir, absTarget)
		if err != nil {
			continue
		}
		if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
			continue
		}
		if len(absDir) > len(best) {
			best = absDir
		}
	}
	return best
}

func schemaRefIfPresent(parentDir string, directories []string) string {
	root := containingDirectory(parentDir, directories)
	if root == "" {
		return ""
	}
	schemaPath := filepath.Join(root, schemaRelDir, schemaFileName)
	if _, err := os.Stat(schemaPath); err != nil {
		return ""
	}
	return schemaRefForFile(filepath.Join(parentDir, "_.table.json"), root)
}

func relPathForDisplay(filePath, projectRoot string) string {
	rel, err := filepath.Rel(projectRoot, filePath)
	if err != nil {
		return filepath.Base(filePath)
	}
	return filepath.ToSlash(rel)
}
