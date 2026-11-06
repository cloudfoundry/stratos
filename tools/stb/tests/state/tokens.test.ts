import { describe, it, expect, beforeEach } from 'vitest';
import {
  rootValues, darkValues, setRootValue, setDarkValue, resetTokens,
  effectiveValue, tokenMetadata, requiredTokens,
} from '@/state/tokens';

describe('token state', () => {
  beforeEach(() => {
    resetTokens();
  });

  it('starts empty', () => {
    expect(rootValues.value.size).toBe(0);
    expect(darkValues.value.size).toBe(0);
  });

  it('setRootValue updates the signal', () => {
    setRootValue('--color-brand-500', '#abcdef');
    expect(rootValues.value.get('--color-brand-500')).toBe('#abcdef');
  });

  it('setDarkValue is independent of root', () => {
    setRootValue('--color-brand-500', '#abcdef');
    setDarkValue('--color-brand-500', '#123456');
    expect(rootValues.value.get('--color-brand-500')).toBe('#abcdef');
    expect(darkValues.value.get('--color-brand-500')).toBe('#123456');
  });

  it('effectiveValue returns override if set, else default', () => {
    expect(effectiveValue('--color-brand-500', false)).toBe('#2196f3');
    setRootValue('--color-brand-500', '#abcdef');
    expect(effectiveValue('--color-brand-500', false)).toBe('#abcdef');
    expect(effectiveValue('--color-brand-500', true)).toBe('#2196f3');
  });

  it('resetTokens clears both maps', () => {
    setRootValue('--color-brand-500', '#abcdef');
    setDarkValue('--color-brand-500', '#123456');
    resetTokens();
    expect(rootValues.value.size).toBe(0);
    expect(darkValues.value.size).toBe(0);
  });
});

describe('tokenMetadata', () => {
  it('loads groups from JSON', () => {
    expect(tokenMetadata.groups.length).toBeGreaterThan(0);
    expect(tokenMetadata.groups[0]!.name).toBe('Brand');
  });

  it('requiredTokens enumerates all required token names', () => {
    const required = requiredTokens();
    expect(required.has('--color-brand-500')).toBe(true);
    expect(required.has('--nav-text-muted')).toBe(false);
  });
});
