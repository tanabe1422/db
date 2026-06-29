package tabledef

import (
	"fmt"
	"strings"
)

var identityTypes = map[string]struct{}{
	"tinyint":  {},
	"smallint": {},
	"int":      {},
	"bigint":   {},
}

func parseBaseDataType(dataType string) string {
	trimmed := strings.TrimSpace(dataType)
	if trimmed == "" {
		return ""
	}

	token := strings.Fields(trimmed)[0]
	if parenIndex := strings.Index(token, "("); parenIndex >= 0 {
		return strings.ToLower(token[:parenIndex])
	}
	return strings.ToLower(token)
}

func isDecimalType(dataType string) bool {
	base := parseBaseDataType(dataType)
	return base == "decimal" || base == "numeric"
}

func validateSemantic(def *TableDefinition) ValidationErrors {
	if def == nil {
		return ValidationErrors{{Message: "table definition is nil"}}
	}

	var errors ValidationErrors

	columnNames := make(map[string]struct{}, len(def.Columns))
	identityColumnIndex := -1

	for i, col := range def.Columns {
		if _, exists := columnNames[col.Name]; exists {
			errors = append(errors, ValidationError{
				Path:    fmt.Sprintf("/columns/%d/name", i),
				Message: fmt.Sprintf("duplicate column name %q", col.Name),
			})
		}
		columnNames[col.Name] = struct{}{}

		baseType := parseBaseDataType(col.DataType)

		if isDecimalType(col.DataType) && col.Precision != nil && col.Scale != nil && *col.Scale > *col.Precision {
			errors = append(errors, ValidationError{
				Path:    fmt.Sprintf("/columns/%d/scale", i),
				Message: fmt.Sprintf("scale (%d) must not exceed precision (%d)", *col.Scale, *col.Precision),
			})
		}

		if col.Identity {
			if identityColumnIndex >= 0 {
				errors = append(errors, ValidationError{
					Path:    fmt.Sprintf("/columns/%d/identity", i),
					Message: "only one identity column is allowed per table",
				})
			} else {
				identityColumnIndex = i
			}

			if _, ok := identityTypes[baseType]; !ok {
				errors = append(errors, ValidationError{
					Path:    fmt.Sprintf("/columns/%d/identity", i),
					Message: fmt.Sprintf("identity is only allowed on integer types (tinyint, smallint, int, bigint), got %q", col.DataType),
				})
			}

			if baseType == "rowversion" {
				errors = append(errors, ValidationError{
					Path:    fmt.Sprintf("/columns/%d/identity", i),
					Message: "identity cannot be used with rowversion",
				})
			}
		}
	}

	for i, pkCol := range def.PrimaryKey {
		if _, ok := columnNames[pkCol]; !ok {
			errors = append(errors, ValidationError{
				Path:    fmt.Sprintf("/primaryKey/%d", i),
				Message: fmt.Sprintf("unknown column %q", pkCol),
			})
		}
	}

	for i, idx := range def.Indexes {
		for j, key := range idx.Keys {
			if _, ok := columnNames[key.Column]; !ok {
				errors = append(errors, ValidationError{
					Path:    fmt.Sprintf("/indexes/%d/keys/%d/column", i, j),
					Message: fmt.Sprintf("unknown column %q", key.Column),
				})
			}
		}
		for j, col := range idx.Include {
			if _, ok := columnNames[col]; !ok {
				errors = append(errors, ValidationError{
					Path:    fmt.Sprintf("/indexes/%d/include/%d", i, j),
					Message: fmt.Sprintf("unknown column %q", col),
				})
			}
		}
	}

	for i, idx := range def.UniqueIndexes {
		for j, key := range idx.Keys {
			if _, ok := columnNames[key.Column]; !ok {
				errors = append(errors, ValidationError{
					Path:    fmt.Sprintf("/uniqueIndexes/%d/keys/%d/column", i, j),
					Message: fmt.Sprintf("unknown column %q", key.Column),
				})
			}
		}
		for j, col := range idx.Include {
			if _, ok := columnNames[col]; !ok {
				errors = append(errors, ValidationError{
					Path:    fmt.Sprintf("/uniqueIndexes/%d/include/%d", i, j),
					Message: fmt.Sprintf("unknown column %q", col),
				})
			}
		}
	}

	for i, constraint := range def.UniqueConstraints {
		for j, col := range constraint.Columns {
			if _, ok := columnNames[col]; !ok {
				errors = append(errors, ValidationError{
					Path:    fmt.Sprintf("/uniqueConstraints/%d/columns/%d", i, j),
					Message: fmt.Sprintf("unknown column %q", col),
				})
			}
		}
	}

	return errors
}
