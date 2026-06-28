package tabledef

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func validDefinition() *TableDefinition {
	return &TableDefinition{
		SchemaVersion: 1,
		Name:          "users",
		NameJa:        "ユーザー",
		Description:   "アプリ利用者マスタ",
		PrimaryKey:    []string{"id"},
		Columns: []Column{
			{Name: "id", DataType: "bigint", NotNull: true},
			{Name: "email", DataType: "nvarchar", Length: intPtr(255), NotNull: true, Unique: true},
			{Name: "createdAt", DataType: "datetime2", NotNull: true},
		},
		Indexes: []Index{
			{
				Keys:    []IndexKey{{Column: "createdAt", Order: "desc"}},
				Include: []string{"email"},
			},
		},
	}
}

func assertNoErrors(t *testing.T, errors ValidationErrors, err error) {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
	if len(errors) > 0 {
		t.Fatalf("expected no errors, got %v", errors)
	}
}

func assertHasErrors(t *testing.T, errors ValidationErrors, err error) {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
	if len(errors) == 0 {
		t.Fatal("expected validation errors")
	}
}

func TestValidateValidDefinition(t *testing.T) {
	errors, err := Validate(validDefinition())
	assertNoErrors(t, errors, err)
}

func TestValidateUsersExampleJSON(t *testing.T) {
	path := filepath.Join("..", "..", "examples", "users.table.json")
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}

	errors, err := ValidateJSON(data)
	assertNoErrors(t, errors, err)
}

func TestValidateNilDefinition(t *testing.T) {
	errors, err := Validate(nil)
	assertHasErrors(t, errors, err)
}

func TestValidateJSONUnsupportedSchemaVersion(t *testing.T) {
	payload := `{"schemaVersion":2,"name":"users","columns":[{"name":"id","dataType":"bigint"}]}`
	errors, err := ValidateJSON([]byte(payload))
	assertHasErrors(t, errors, err)
}

func TestValidateJSONEmptyName(t *testing.T) {
	payload := `{"schemaVersion":1,"name":"   ","columns":[{"name":"id","dataType":"bigint"}]}`
	errors, err := ValidateJSON([]byte(payload))
	assertHasErrors(t, errors, err)
}

func TestValidateJSONNoColumns(t *testing.T) {
	payload := `{"schemaVersion":1,"name":"users","columns":[]}`
	errors, err := ValidateJSON([]byte(payload))
	assertHasErrors(t, errors, err)
}

func TestValidateDuplicateColumnName(t *testing.T) {
	def := validDefinition()
	def.Columns = append(def.Columns, Column{Name: "id", DataType: "int"})
	errors, err := Validate(def)
	assertHasErrors(t, errors, err)
}

func TestValidateJSONUnknownDataType(t *testing.T) {
	payload := `{"schemaVersion":1,"name":"users","columns":[{"name":"id","dataType":"text"}]}`
	errors, err := ValidateJSON([]byte(payload))
	assertHasErrors(t, errors, err)
}

func TestValidateJSONDecimalMissingPrecision(t *testing.T) {
	payload := `{"schemaVersion":1,"name":"users","columns":[{"name":"amount","dataType":"decimal","scale":2}]}`
	errors, err := ValidateJSON([]byte(payload))
	assertHasErrors(t, errors, err)
}

func TestValidateJSONNvarcharMissingLength(t *testing.T) {
	payload := `{"schemaVersion":1,"name":"users","columns":[{"name":"email","dataType":"nvarchar"}]}`
	errors, err := ValidateJSON([]byte(payload))
	assertHasErrors(t, errors, err)
}

func TestValidateUnknownPrimaryKeyColumn(t *testing.T) {
	def := validDefinition()
	def.PrimaryKey = []string{"missing"}
	errors, err := Validate(def)
	assertHasErrors(t, errors, err)
}

func TestValidateJSONTooManyIndexes(t *testing.T) {
	columns := `[{"name":"id","dataType":"bigint"}]`
	indexes := make([]map[string]any, 10)
	for i := range indexes {
		indexes[i] = map[string]any{
			"keys": []map[string]string{{"column": "id"}},
		}
	}
	indexesJSON, err := json.Marshal(indexes)
	if err != nil {
		t.Fatal(err)
	}
	payload := `{"schemaVersion":1,"name":"users","columns":` + columns + `,"indexes":` + string(indexesJSON) + `}`
	errors, err := ValidateJSON([]byte(payload))
	assertHasErrors(t, errors, err)
}

func TestValidateJSONIndexEmptyKeys(t *testing.T) {
	payload := `{"schemaVersion":1,"name":"users","columns":[{"name":"id","dataType":"bigint"}],"indexes":[{"keys":[]}]}`
	errors, err := ValidateJSON([]byte(payload))
	assertHasErrors(t, errors, err)
}

func TestValidateIndexUnknownColumn(t *testing.T) {
	def := validDefinition()
	def.Indexes = []Index{{Keys: []IndexKey{{Column: "missing"}}}}
	errors, err := Validate(def)
	assertHasErrors(t, errors, err)
}

func TestValidateIndexUnknownIncludeColumn(t *testing.T) {
	def := validDefinition()
	def.Indexes = []Index{{Keys: []IndexKey{{Column: "id"}}, Include: []string{"missing"}}}
	errors, err := Validate(def)
	assertHasErrors(t, errors, err)
}

func TestValidateJSONInvalidSortOrder(t *testing.T) {
	payload := `{"schemaVersion":1,"name":"users","columns":[{"name":"id","dataType":"bigint"}],"indexes":[{"keys":[{"column":"id","order":"invalid"}]}]}`
	errors, err := ValidateJSON([]byte(payload))
	assertHasErrors(t, errors, err)
}

func TestValidateEmptySortOrderIsAsc(t *testing.T) {
	def := validDefinition()
	def.Indexes = []Index{{Keys: []IndexKey{{Column: "id"}}}}
	errors, err := Validate(def)
	assertNoErrors(t, errors, err)
}

func TestValidateScaleExceedsPrecision(t *testing.T) {
	def := validDefinition()
	scale := 5
	precision := 3
	def.Columns = []Column{
		{Name: "amount", DataType: "decimal", Precision: &precision, Scale: &scale},
	}
	errors, err := Validate(def)
	assertHasErrors(t, errors, err)
}

func intPtr(v int) *int {
	return &v
}
