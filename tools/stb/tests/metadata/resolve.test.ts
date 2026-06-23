import { describe, it, expect } from 'vitest';
import { resolveDescription, tokenNames } from '@/metadata/resolve';
import type { ElementMapping, CuratedDescriptions } from '@/metadata/types';

const curated: CuratedDescriptions = {
  'auth.login.card': 'Login form card',
  'nav.brand': 'Product brand mark',
};

function m(partial: Partial<ElementMapping>): ElementMapping {
  return { selector: 'div', snapshotId: 'x.y.z', tokens: [], ...partial };
}

describe('resolveDescription precedence', () => {
  it('1. harvested locator.name wins', () => {
    expect(resolveDescription(m({
      locator: { role: 'button', name: 'Sign in' },
      description: 'ignored',
    }), curated)).toBe('Sign in');
  });

  it('2a. inline curated string when no harvested name', () => {
    expect(resolveDescription(m({ description: 'Inline text' }), curated)).toBe('Inline text');
  });

  it('2b. {ref} resolves through curated, keyed by snapshotId', () => {
    expect(resolveDescription(m({ description: { ref: 'auth.login.card' } }), curated))
      .toBe('Login form card');
  });

  it('2b. dedup: two scenes referencing the same id resolve identically', () => {
    const a = m({ snapshotId: 'auth.login.brand', description: { ref: 'nav.brand' } });
    const b = m({ snapshotId: 'cf.app.brand', description: { ref: 'nav.brand' } });
    expect(resolveDescription(a, curated)).toBe(resolveDescription(b, curated));
    expect(resolveDescription(a, curated)).toBe('Product brand mark');
  });

  it('3. selector fallback when nothing else', () => {
    expect(resolveDescription(m({ selector: 'div.login-card' }), curated)).toBe('div.login-card');
  });

  it('unresolved {ref} falls back to selector', () => {
    expect(resolveDescription(m({ selector: 'div.x', description: { ref: 'missing.id' } }), curated))
      .toBe('div.x');
  });

  it('tokenNames extracts the name field', () => {
    expect(tokenNames(m({ tokens: [{ name: '--a' }, { name: '--b', property: 'color' }] })))
      .toEqual(['--a', '--b']);
  });
});
