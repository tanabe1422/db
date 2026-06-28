package tabledef

import (
	"encoding/json"
	"sync"

	"db-gui/schema"

	"github.com/santhosh-tekuri/jsonschema/v6"
)

const tableDefinitionSchemaURL = "https://db-gui.local/schema/table.definition.schema.json"

var (
	schemaOnce     sync.Once
	compiledSchema *jsonschema.Schema
	schemaErr      error
)

func tableDefinitionSchema() (*jsonschema.Schema, error) {
	schemaOnce.Do(func() {
		var doc any
		if err := json.Unmarshal(schema.TableDefinitionJSON, &doc); err != nil {
			schemaErr = err
			return
		}

		compiler := jsonschema.NewCompiler()
		if err := compiler.AddResource(tableDefinitionSchemaURL, doc); err != nil {
			schemaErr = err
			return
		}
		compiledSchema, schemaErr = compiler.Compile(tableDefinitionSchemaURL)
	})
	return compiledSchema, schemaErr
}

func validateAgainstSchema(data any) (ValidationErrors, error) {
	schema, err := tableDefinitionSchema()
	if err != nil {
		return nil, err
	}
	if err := schema.Validate(data); err != nil {
		return schemaValidationErrors(err), nil
	}
	return nil, nil
}

func schemaValidationErrors(err error) ValidationErrors {
	validationErr, ok := err.(*jsonschema.ValidationError)
	if !ok {
		return ValidationErrors{{Message: err.Error()}}
	}
	return flattenValidationError(validationErr)
}

func flattenValidationError(err *jsonschema.ValidationError) ValidationErrors {
	path := instanceLocationPath(err.InstanceLocation)
	errors := ValidationErrors{{Path: path, Message: err.Error()}}
	for _, cause := range err.Causes {
		errors = append(errors, flattenValidationError(cause)...)
	}
	return errors
}

func instanceLocationPath(tokens []string) string {
	if len(tokens) == 0 {
		return ""
	}
	path := ""
	for _, token := range tokens {
		path += "/" + token
	}
	return path
}
