package tabledef

import (
	"encoding/json"
)

func ValidateJSON(data []byte) (ValidationErrors, error) {
	var parsed any
	if err := json.Unmarshal(data, &parsed); err != nil {
		return ValidationErrors{{Message: err.Error()}}, nil
	}
	return validateParsed(parsed)
}

func Validate(def *TableDefinition) (ValidationErrors, error) {
	if def == nil {
		return ValidationErrors{{Message: "table definition is nil"}}, nil
	}

	data, err := json.Marshal(def)
	if err != nil {
		return nil, err
	}
	return ValidateJSON(data)
}

func validateParsed(parsed any) (ValidationErrors, error) {
	schemaErrors, err := validateAgainstSchema(parsed)
	if err != nil {
		return nil, err
	}
	if len(schemaErrors) > 0 {
		return schemaErrors, nil
	}

	var def TableDefinition
	data, err := json.Marshal(parsed)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(data, &def); err != nil {
		return ValidationErrors{{Message: err.Error()}}, nil
	}

	semanticErrors := validateSemantic(&def)
	if len(semanticErrors) > 0 {
		return semanticErrors, nil
	}

	return nil, nil
}
