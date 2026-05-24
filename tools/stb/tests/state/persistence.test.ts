import { describe, it, expect, beforeEach } from 'vitest';
import { saveSession, restoreSession } from '@/state/persistence';
import { rootValues, darkValues, resetTokens } from '@/state/tokens';

describe('session persistence', () => {
  beforeEach(() => {
    resetTokens();
    localStorage.clear();
  });

  it('saveSession round-trips via restoreSession', () => {
    rootValues.value = new Map([['--color-brand-500', '#abc']]);
    darkValues.value = new Map([['--color-brand-500', '#def']]);
    saveSession();
    resetTokens();
    expect(restoreSession()).toBe(true);
    expect(rootValues.value.get('--color-brand-500')).toBe('#abc');
    expect(darkValues.value.get('--color-brand-500')).toBe('#def');
  });

  it('restoreSession returns false when nothing saved', () => {
    expect(restoreSession()).toBe(false);
  });
});
