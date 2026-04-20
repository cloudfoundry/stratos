import { describe, expect, it } from 'vitest';
import { CFEntityRef, cfEntityId, isComposite, parseCfEntityId } from './cf-entity-ref';

describe('cfEntityId', () => {
  it('composes cnsi + entity GUIDs with : separator', () => {
    const ref: CFEntityRef = { cnsiGuid: 'cf-1', entityGuid: 'org-a' };
    expect(cfEntityId(ref)).toBe('cf-1:org-a');
  });

  it('throws on empty cnsiGuid', () => {
    expect(() => cfEntityId({ cnsiGuid: '', entityGuid: 'org-a' })).toThrow(/cnsiGuid.*required/);
  });

  it('throws on empty entityGuid', () => {
    expect(() => cfEntityId({ cnsiGuid: 'cf-1', entityGuid: '' })).toThrow(/entityGuid.*required/);
  });

  it('rejects values containing : to avoid ambiguity', () => {
    expect(() => cfEntityId({ cnsiGuid: 'cf:1', entityGuid: 'org-a' })).toThrow(/colon/);
    expect(() => cfEntityId({ cnsiGuid: 'cf-1', entityGuid: 'org:a' })).toThrow(/colon/);
  });
});

describe('parseCfEntityId', () => {
  it('parses a valid composite back into CFEntityRef', () => {
    expect(parseCfEntityId('cf-1:org-a')).toEqual({ cnsiGuid: 'cf-1', entityGuid: 'org-a' });
  });

  it('returns null for bare GUIDs (no colon)', () => {
    expect(parseCfEntityId('org-a')).toBeNull();
  });

  it('returns null for malformed composites', () => {
    expect(parseCfEntityId(':org-a')).toBeNull();
    expect(parseCfEntityId('cf-1:')).toBeNull();
    expect(parseCfEntityId('')).toBeNull();
  });
});

describe('isComposite', () => {
  it('returns true for well-formed composites', () => {
    expect(isComposite('cf-1:org-a')).toBe(true);
  });

  it('returns false for bare GUIDs and malformed values', () => {
    expect(isComposite('org-a')).toBe(false);
    expect(isComposite(':org-a')).toBe(false);
    expect(isComposite('cf-1:')).toBe(false);
    expect(isComposite('')).toBe(false);
  });
});
