// schema-validate.util.ts
import Ajv from 'ajv';

export interface SchemaWarning {
  path: string;     // JSON Pointer to the offending node ('' = root)
  message: string;
}

// strict:false + tolerant compile: OSB schemas are Draft-4, ajv@8 defaults to
// Draft-07. Differences (boolean exclusiveMinimum, `id` vs `$id`) are minor and
// this validator is ADVISORY — never let it throw or block.
const ajv = new Ajv({ strict: false, allErrors: true, validateSchema: false });

export function validateAgainstSchema(schema: object | undefined, data: unknown): SchemaWarning[] {
  if (!schema) {
    return [];
  }
  let validate;
  try {
    validate = ajv.compile(schema);
  } catch {
    return []; // non-compilable schema → defer entirely to the broker
  }
  if (validate(data)) {
    return [];
  }
  return (validate.errors ?? []).map(e => ({
    path: e.instancePath || '',
    message: `${(e.instancePath || '(root)')} ${e.message ?? 'is invalid'}`.trim(),
  }));
}
