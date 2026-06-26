import { describe, it, expect } from 'vitest';
import { applyLevers } from '@/iframe-bridge/apply-levers';

function doc(html: string): Document {
  const d = document.implementation.createHTMLDocument('t');
  d.body.innerHTML = html;
  return d;
}

describe('applyLevers', () => {
  it('sets text content by snapshot-id', () => {
    const d = doc('<h1 data-stratos-snapshot-id="auth.login.title">old</h1>');
    applyLevers(d, [{ snapshotId: 'auth.login.title', kind: 'content', text: 'new' }]);
    expect(d.querySelector('h1')!.textContent).toBe('new');
  });
  it('sets img src for an asset lever', () => {
    const d = doc('<img data-stratos-snapshot-id="auth.login.logo" src="a.png" />');
    applyLevers(d, [{ snapshotId: 'auth.login.logo', kind: 'asset', ref: 'b.png' }]);
    expect(d.querySelector('img')!.getAttribute('src')).toBe('b.png');
  });
  it('hides an element for a false visibility lever via show-<id> convention', () => {
    const d = doc('<img data-stratos-snapshot-id="auth.login.logo" src="a.png" />');
    applyLevers(d, [{ snapshotId: 'auth.login.show-logo', kind: 'visibility', shown: false }]);
    expect((d.querySelector('img') as HTMLElement).style.display).toBe('none');
  });
});
