import { describe, expect, it } from 'vitest';

import { jsonModeWarning, looksLikeJson, validateVariableName } from './variable-edit-dialog.validation';

describe('validateVariableName', () => {
  // -------------------------------------------------------------------------
  // Hard errors (Save must be blocked) — CF rejects these or they collide.
  // -------------------------------------------------------------------------

  it('blocks an empty name', () => {
    expect(validateVariableName('', []).hardError).toMatch(/required/i);
    expect(validateVariableName('   ', []).hardError).toMatch(/required/i);
  });

  it('blocks a VCAP_ / VMC_ prefix (case-insensitive)', () => {
    expect(validateVariableName('VCAP_SERVICES', []).hardError).toMatch(/VCAP_|VMC_/);
    expect(validateVariableName('vcap_foo', []).hardError).toMatch(/VCAP_|VMC_/);
    expect(validateVariableName('VMC_THING', []).hardError).toMatch(/VCAP_|VMC_/);
    expect(validateVariableName('vmc_thing', []).hardError).toMatch(/VCAP_|VMC_/);
  });

  it('blocks the reserved name PORT', () => {
    expect(validateVariableName('PORT', []).hardError).toMatch(/PORT/);
  });

  it('blocks a duplicate of an existing key', () => {
    expect(validateVariableName('FOO', ['FOO', 'BAR']).hardError).toMatch(/in use/i);
  });

  it('duplicate check is case-sensitive (env var names are case-sensitive)', () => {
    expect(validateVariableName('foo', ['FOO']).hardError).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Warnings (Save allowed) — shell-pattern violations CF accepts.
  // -------------------------------------------------------------------------

  it('warns (but does not block) when the name violates the shell-safe pattern', () => {
    const r = validateVariableName('my-var', []);
    expect(r.hardError).toBeNull();
    expect(r.warning).toMatch(/shell/i);
  });

  it('warns on a leading digit but does not block', () => {
    const r = validateVariableName('2nd', []);
    expect(r.hardError).toBeNull();
    expect(r.warning).toMatch(/shell/i);
  });

  it('accepts a clean shell-safe name with no error or warning', () => {
    expect(validateVariableName('MY_VAR_1', [])).toEqual({ hardError: null, warning: null });
    expect(validateVariableName('_private', [])).toEqual({ hardError: null, warning: null });
  });

  it('hard error takes precedence over the shell-pattern warning', () => {
    // 'VCAP-X' both starts with VCAP and breaks the shell pattern — hard wins.
    const r = validateVariableName('VCAP_X', []);
    expect(r.hardError).toMatch(/VCAP_|VMC_/);
  });
});

describe('looksLikeJson', () => {
  it('is true for an object/array that parses', () => {
    expect(looksLikeJson('{"a":1}')).toBe(true);
    expect(looksLikeJson('  [1,2,3] ')).toBe(true);
  });

  it('is false for a bare string/number even though JSON.parse would accept it', () => {
    expect(looksLikeJson('hello')).toBe(false);
    expect(looksLikeJson('42')).toBe(false);
    expect(looksLikeJson('"quoted"')).toBe(false);
  });

  it('is false for empty or malformed object text', () => {
    expect(looksLikeJson('')).toBe(false);
    expect(looksLikeJson('   ')).toBe(false);
    expect(looksLikeJson('{not json}')).toBe(false);
  });
});

describe('jsonModeWarning', () => {
  it('returns null for valid JSON', () => {
    expect(jsonModeWarning('{"a":1}')).toBeNull();
  });

  it('returns null for empty value (no nagging)', () => {
    expect(jsonModeWarning('')).toBeNull();
    expect(jsonModeWarning('   ')).toBeNull();
  });

  it('warns for invalid JSON (but the caller still allows save)', () => {
    expect(jsonModeWarning('{not json}')).toMatch(/json/i);
    expect(jsonModeWarning('hello')).toMatch(/json/i);
  });
});
