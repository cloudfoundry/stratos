import { describe, it, expect } from 'vitest';
import { resolveRef, mergeAllOf, classifyNode, schemaToSkeleton, stripEmpty, mergeSkeleton } from './schema-resolve.util';
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

describe('schemaToSkeleton', () => {
  it('emits every key with an unset placeholder by type', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        size: { type: 'integer' },
        enabled: { type: 'boolean' },
        region: { type: 'string', enum: ['us', 'eu'] },
        tags: { type: 'array', items: { type: 'string' } },
        net: { type: 'object', properties: { subnet: { type: 'string' } } },
      },
    };
    expect(schemaToSkeleton(schema)).toEqual({
      name: '', size: null, enabled: null, region: '', tags: [], net: { subnet: '' },
    });
  });

  it('resolves $ref when building the skeleton', () => {
    const r: JsonSchema = {
      definitions: { Addr: { type: 'object', properties: { city: { type: 'string' } } } },
      type: 'object', properties: { addr: { $ref: '#/definitions/Addr' } },
    };
    expect(schemaToSkeleton(r, r)).toEqual({ addr: { city: '' } });
  });

  it('does not recurse forever on self-referential schemas', () => {
    const r: any = { type: 'object', properties: {} };
    r.properties.self = { $ref: '#/' };  // points back at root
    expect(() => schemaToSkeleton(r, r)).not.toThrow();
  });
});

describe('stripEmpty', () => {
  it('drops null/""/[]/empty-objects but keeps false and 0', () => {
    expect(stripEmpty({
      a: '', b: null, c: [], d: {}, keepFalse: false, keepZero: 0, keepStr: 'x',
      nested: { gone: '', stay: 1 },
    })).toEqual({ keepFalse: false, keepZero: 0, keepStr: 'x', nested: { stay: 1 } });
  });

  it('collapses an all-unset skeleton to undefined (→ no params)', () => {
    const skeleton = { name: '', size: null, tags: [], net: { subnet: '' } };
    expect(stripEmpty(skeleton)).toBeUndefined();
  });

  it('a skeleton with one filled value submits only that value', () => {
    const filled = { name: 'db', size: null, net: { subnet: '' } };
    expect(stripEmpty(filled)).toEqual({ name: 'db' });
  });
});

describe('mergeSkeleton', () => {
  const skeleton = { enableBackups: null, region: '', size: null, net: { subnet: '' } };

  it('returns the bare skeleton when there is no data', () => {
    expect(mergeSkeleton(skeleton, null)).toEqual(skeleton);
    expect(mergeSkeleton(skeleton, {})).toEqual(skeleton);
  });

  it('overlays set values while keeping the other fields as empty placeholders', () => {
    expect(mergeSkeleton(skeleton, { enableBackups: true })).toEqual({
      enableBackups: true, region: '', size: null, net: { subnet: '' },
    });
  });

  it('keeps falsy-but-set values (false / 0) and merges nested objects', () => {
    expect(mergeSkeleton(skeleton, { enableBackups: false, size: 0, net: { subnet: '10.0.0.0/8' } })).toEqual({
      enableBackups: false, region: '', size: 0, net: { subnet: '10.0.0.0/8' },
    });
  });

  it('preserves data keys not present in the skeleton (map/additionalProperties)', () => {
    expect(mergeSkeleton({ known: '' }, { known: 'x', extra: 1 })).toEqual({ known: 'x', extra: 1 });
  });
});
