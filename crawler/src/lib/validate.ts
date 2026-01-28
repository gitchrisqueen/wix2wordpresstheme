/**
 * Schema Validation Utilities
 *
 * Provides helpers for validating data against JSON schemas using Ajv.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFile } from 'fs/promises';
import { join } from 'path';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * Load and compile a JSON schema
 */
export async function loadSchema(schemaPath: string) {
  const schemaContent = await readFile(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaContent);
  return ajv.compile(schema);
}

/**
 * Validate data against a schema file
 */
export async function validateAgainstSchema(data: unknown, schemaPath: string): Promise<{
  valid: boolean;
  errors: string[] | null;
}> {
  try {
    const validate = await loadSchema(schemaPath);
    const valid = validate(data);

    if (!valid && validate.errors) {
      const errors = validate.errors.map(
        (err) => `${err.instancePath || 'root'} ${err.message}`
      );
      return { valid: false, errors };
    }

    return { valid: true, errors: null };
  } catch (error) {
    return {
      valid: false,
      errors: [`Schema validation error: ${(error as Error).message}`],
    };
  }
}

/**
 * Validate data against schema and throw if invalid
 */
export async function validateOrThrow(data: unknown, schemaPath: string): Promise<void> {
  const result = await validateAgainstSchema(data, schemaPath);
  if (!result.valid) {
    throw new Error(`Validation failed: ${result.errors?.join(', ')}`);
  }
}

/**
 * Get schema path helper
 */
export function getSchemaPath(schemaName: string): string {
  return join(process.cwd(), 'crawler', 'schemas', schemaName);
}
