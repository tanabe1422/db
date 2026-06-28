import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020'

import tableDefinitionSchema from '../../../schema/table.definition.schema.json'
import type { TableDefinition } from '../types/table'
import { validateTableSemantic, type ValidationError } from './validateTableSemantic'

export type { ValidationError } from './validateTableSemantic'

let validateSchema: ValidateFunction | null = null

function getValidator(): ValidateFunction {
  if (!validateSchema) {
    const ajv = new Ajv2020({ allErrors: true, strict: false })
    validateSchema = ajv.compile(tableDefinitionSchema)
  }
  return validateSchema
}

function schemaErrors(errors: ErrorObject[] | null | undefined): ValidationError[] {
  if (!errors) {
    return [{ path: '', message: 'validation failed' }]
  }
  return errors.map((error) => ({
    path: error.instancePath,
    message: error.message ?? 'validation failed',
  }))
}

function isTableDefinition(data: unknown): data is TableDefinition {
  return typeof data === 'object' && data !== null && 'columns' in data
}

export function validateTableDefinition(data: unknown): ValidationError[] {
  const validate = getValidator()
  if (!validate(data)) {
    return schemaErrors(validate.errors)
  }
  if (!isTableDefinition(data)) {
    return [{ path: '', message: 'invalid table definition' }]
  }
  return validateTableSemantic(data)
}
