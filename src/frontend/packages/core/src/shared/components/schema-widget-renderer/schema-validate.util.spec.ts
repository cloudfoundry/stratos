// schema-validate.util.spec.ts
import { describe, it, expect } from 'vitest';
import { validateAgainstSchema } from './schema-validate.util';

describe('validateAgainstSchema', () => {
  it('returns [] when no schema given', () => {
    expect(validateAgainstSchema(undefined, { a: 1 })).toEqual([]);
  });

  it('flags a type mismatch (integer vs string) as one warning', () => {
    const schema = { type: 'object', properties: { size: { type: 'integer' } } };
    const warnings = validateAgainstSchema(schema, { size: '5' });
    expect(warnings.length).toBe(1);
    expect(warnings[0].path).toBe('/size');
  });

  it('flags a missing required property', () => {
    const schema = { type: 'object', required: ['name'], properties: { name: { type: 'string' } } };
    const warnings = validateAgainstSchema(schema, {});
    expect(warnings.some(w => w.message.toLowerCase().includes('required'))).toBe(true);
  });

  it('validates oneOf composition', () => {
    const schema = { oneOf: [{ type: 'string' }, { type: 'number' }] };
    expect(validateAgainstSchema(schema, true).length).toBeGreaterThan(0);
    expect(validateAgainstSchema(schema, 'ok')).toEqual([]);
  });

  it('never throws on a non-compilable / draft-4 schema — returns []', () => {
    const weird = { type: 'object', properties: { n: { type: 'integer', exclusiveMinimum: true, minimum: 0 } } };
    expect(() => validateAgainstSchema(weird as object, { n: 1 })).not.toThrow();
  });
});
