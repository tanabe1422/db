package app

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestInitAISetup(t *testing.T) {
	root := t.TempDir()
	sub := filepath.Join(root, "masters")
	if err := os.MkdirAll(sub, 0o755); err != nil {
		t.Fatal(err)
	}

	existing := filepath.Join(root, "users.table.json")
	if err := os.WriteFile(existing, []byte(`{
  "schemaVersion": 1,
  "name": "users",
  "columns": []
}
`), 0o644); err != nil {
		t.Fatal(err)
	}

	nested := filepath.Join(sub, "orders.table.json")
	if err := os.WriteFile(nested, []byte(`{
  "$schema": "existing.json",
  "schemaVersion": 1,
  "name": "orders",
  "columns": []
}
`), 0o644); err != nil {
		t.Fatal(err)
	}

	result, err := initAISetup(root)
	if err != nil {
		t.Fatalf("initAISetup: %v", err)
	}

	if !result.SchemaWritten {
		t.Fatal("expected schema to be written")
	}
	if !result.CursorRuleWritten {
		t.Fatal("expected cursor rule to be written")
	}
	if !result.ClaudeMDWritten {
		t.Fatal("expected CLAUDE.md to be written")
	}
	if !result.VscodeSettingsWritten {
		t.Fatal("expected vscode settings to be written")
	}
	if result.TableJSONPatched != 1 {
		t.Fatalf("expected 1 patched file, got %d", result.TableJSONPatched)
	}
	if result.TableJSONSkipped != 1 {
		t.Fatalf("expected 1 skipped file, got %d", result.TableJSONSkipped)
	}

	schemaPath := filepath.Join(root, "schema", "table.definition.schema.json")
	if _, err := os.Stat(schemaPath); err != nil {
		t.Fatalf("schema file missing: %v", err)
	}

	rulePath := filepath.Join(root, ".cursor", "rules", "table-json.mdc")
	if _, err := os.Stat(rulePath); err != nil {
		t.Fatalf("cursor rule missing: %v", err)
	}

	claudePath := filepath.Join(root, "CLAUDE.md")
	if _, err := os.Stat(claudePath); err != nil {
		t.Fatalf("CLAUDE.md missing: %v", err)
	}

	usersData, err := os.ReadFile(existing)
	if err != nil {
		t.Fatal(err)
	}
	var users map[string]any
	if err := json.Unmarshal(usersData, &users); err != nil {
		t.Fatal(err)
	}
	if users["$schema"] != "schema/table.definition.schema.json" {
		t.Fatalf("unexpected $schema: %v", users["$schema"])
	}

	nestedData, err := os.ReadFile(nested)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(nestedData), `"$schema": "existing.json"`) {
		t.Fatal("expected existing $schema to be preserved")
	}

	result2, err := initAISetup(root)
	if err != nil {
		t.Fatalf("second initAISetup: %v", err)
	}
	if result2.SchemaWritten || result2.CursorRuleWritten || result2.ClaudeMDWritten || result2.VscodeSettingsWritten {
		t.Fatalf("expected no overwrites on second run: %+v", result2)
	}
	if result2.TableJSONPatched != 0 || result2.TableJSONSkipped != 2 {
		t.Fatalf("unexpected patch counts on second run: %+v", result2)
	}
}

func TestInitAISetupOnRepoExamples(t *testing.T) {
	root := filepath.Join("..", "..", "examples")
	info, err := os.Stat(root)
	if err != nil {
		t.Skip("examples directory not found")
	}
	if !info.IsDir() {
		t.Skip("examples is not a directory")
	}

	_, err = initAISetup(root)
	if err != nil {
		t.Fatalf("initAISetup: %v", err)
	}
}

func TestPatchTableJSONSchemaSkipsInvalid(t *testing.T) {
	root := t.TempDir()
	empty := filepath.Join(root, "empty.table.json")
	if err := os.WriteFile(empty, []byte(""), 0o644); err != nil {
		t.Fatal(err)
	}

	_, err := patchTableJSONSchema(empty, root)
	if err == nil {
		t.Fatal("expected error for empty file")
	}
}

func TestSchemaRefForFile(t *testing.T) {
	root := t.TempDir()
	schemaDir := filepath.Join(root, "schema")
	if err := os.MkdirAll(schemaDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(schemaDir, schemaFileName), []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}

	rootFile := filepath.Join(root, "users.table.json")
	subFile := filepath.Join(root, "masters", "orders.table.json")

	if got := schemaRefForFile(rootFile, root); got != "schema/table.definition.schema.json" {
		t.Fatalf("root file ref: got %q", got)
	}
	if got := schemaRefForFile(subFile, root); got != "../schema/table.definition.schema.json" {
		t.Fatalf("nested file ref: got %q", got)
	}
}

func TestNewTableJSONContentWithSchema(t *testing.T) {
	content, err := newTableJSONContent("users", "schema/table.definition.schema.json")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(content, `"$schema": "schema/table.definition.schema.json"`) {
		t.Fatalf("unexpected content: %s", content)
	}
}
