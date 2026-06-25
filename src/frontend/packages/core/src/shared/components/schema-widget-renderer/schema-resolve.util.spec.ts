import { describe, it, expect } from 'vitest';
import { resolveRef, mergeAllOf, classifyNode } from './schema-resolve.util';
import { JsonSchema } from './schema-node.model';

const root = { definitions: { Addr: { type: 'object', properties: { city: { type: 'string' } } } } };

describe('resolveRef', () => {
  it('resolves #/definitions ref', () => {
    expect(resolveRef({ $ref: '#/definitions/Addr' }, root).type).toBe('object');
  });
  it('resolves #/$defs ref', () => {
    const r = { $defs: { Tag: { type: 'string' } } };
    expect(resolveRef({ $ref: '#/$defs/Tag' }, r).type).toBe('string');
  });
  it('cycle-guards self-referential refs without infinite loop', () => {
    const r: any = { definitions: {} }; r.definitions.Node = { $ref: '#/definitions/Node' };
    expect(() => resolveRef({ $ref: '#/definitions/Node' }, r)).not.toThrow();
  });
  it('strips $ref on unresolvable/non-fragment refs so caller cannot re-resolve', () => {
    const stripped = resolveRef({ $ref: 'other.json#/X', title: 'keep' }, {});
    expect(stripped.$ref).toBeUndefined();
    expect(stripped.title).toBe('keep');
  });
});

describe('mergeAllOf', () => {
  it('unions properties and required', () => {
    const n = { allOf: [
      { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
      { type: 'object', properties: { b: { type: 'number' } }, required: ['b'] },
    ] };
    const merged = mergeAllOf(n, {});
    expect(Object.keys(merged.properties).sort()).toEqual(['a', 'b']);
    expect(merged.required.sort()).toEqual(['a', 'b']);
  });
});

describe('classifyNode', () => {
  const cases: [JsonSchema, string][] = [
    [{ type: 'object', properties: {} }, 'object'],
    [{ type: 'object', additionalProperties: true }, 'map'],
    [{ type: 'array', items: { type: 'string' } }, 'array'],
    [{ type: 'array', items: [{ type: 'string' }, { type: 'number' }] }, 'tuple'],
    [{ type: 'array', items: { enum: ['a', 'b'] }, uniqueItems: true }, 'multiselect'],
    [{ type: 'array', items: { enum: ['a', 'b'] } }, 'array'],
    [{ enum: ['a', 'b'] }, 'enum'],
    [{ type: 'string' }, 'string'],
    [{ type: 'integer' }, 'number'],
    [{ type: 'boolean' }, 'boolean'],
    [{ type: 'null' }, 'null'],
    [{ oneOf: [{ type: 'string' }] }, 'oneOf'],
    [{ anyOf: [{ type: 'string' }] }, 'anyOf'],
    [{ not: {} }, 'unknown'],
  ];
  it.each(cases)('classifies %o as %s', (schema, kind) => {
    expect(classifyNode(schema as JsonSchema, {}).kind).toBe(kind);
  });
});
