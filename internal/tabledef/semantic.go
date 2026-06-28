package tabledef

import "fmt"

func validateSemantic(def *TableDefinition) ValidationErrors {
	if def == nil {
		return ValidationErrors{{Message: "table definition is nil"}}
	}

	var errors ValidationErrors

	columnNames := make(map[string]struct{}, len(def.Columns))
	for i, col := range def.Columns {
		if _, exists := columnNames[col.Name]; exists {
			errors = append(errors, ValidationError{
				Path:    fmt.Sprintf("/columns/%d/name", i),
				Message: fmt.Sprintf("duplicate column name %q", col.Name),
			})
		}
		columnNames[col.Name] = struct{}{}

		if isDecimalType(col.DataType) && col.Precision != nil && col.Scale != nil && *col.Scale > *col.Precision {
			errors = append(errors, ValidationError{
				Path:    fmt.Sprintf("/columns/%d/scale", i),
				Message: fmt.Sprintf("scale (%d) must not exceed precision (%d)", *col.Scale, *col.Precision),
			})
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

	return errors
}

func isDecimalType(dataType string) bool {
	return dataType == "decimal" || dataType == "numeric"
}
