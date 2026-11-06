import { describe, it, expect } from 'vitest';
import { applyLevers } from '@/iframe-bridge/apply-levers';

function doc(html: string): Document {
  const d = document.implementation.createHTMLDocument('t');
  d.body.innerHTML = html;
  return d;
}

describe('applyLevers', () => {
  it('sets text content by snapshot-id', () => {
    const d = doc('<h1 stb-snapshot-id="auth.login.title">old</h1>');
    applyLevers(d, [{ snapshotId: 'auth.login.title', kind: 'content', text: 'new' }]);
    expect(d.querySelector('h1')!.textContent).toBe('new');
  });
  it('renders subset-formatted content via DOM construction when the patch carries format subset', () => {
    const d = doc('<p stb-snapshot-id="shared.confirm-dialog.message">old</p>');
    applyLevers(d, [{ snapshotId: 'shared.confirm-dialog.message', kind: 'content', text: '**Careful:** this _cannot_ be undone.\nReally.', format: 'subset' }]);
    const p = d.querySelector('p')!;
    expect(p.querySelector('strong')!.textContent).toBe('Careful:');
    expect(p.querySelector('em')!.textContent).toBe('cannot');
    expect(p.querySelectorAll('br').length).toBe(1);
  });
  it('subset content never interprets markup — hostile text stays text', () => {
    const d = doc('<p stb-snapshot-id="m">old</p>');
    applyLevers(d, [{ snapshotId: 'm', kind: 'content', text: '<img src=x onerror=alert(1)>**b**', format: 'subset' }]);
    const p = d.querySelector('p')!;
    expect(p.querySelector('img')).toBeNull();
    expect(p.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(p.querySelector('strong')!.textContent).toBe('b');
  });
  it('plain content (no format) still uses textContent — markers stay literal', () => {
    const d = doc('<p stb-snapshot-id="m">old</p>');
    applyLevers(d, [{ snapshotId: 'm', kind: 'content', text: '**not bold**' }]);
    const p = d.querySelector('p')!;
    expect(p.querySelector('strong')).toBeNull();
    expect(p.textContent).toBe('**not bold**');
  });
  it('sets img src for an asset lever', () => {
    const d = doc('<img stb-snapshot-id="auth.login.logo" src="a.png" />');
    applyLevers(d, [{ snapshotId: 'auth.login.logo', kind: 'asset', ref: 'b.png' }]);
    expect(d.querySelector('img')!.getAttribute('src')).toBe('b.png');
  });
  it('hides an element for a false visibility lever via show-<id> convention', () => {
    const d = doc('<img stb-snapshot-id="auth.login.logo" src="a.png" />');
    applyLevers(d, [{ snapshotId: 'auth.login.show-logo', kind: 'visibility', shown: false }]);
    expect((d.querySelector('img') as HTMLElement).style.display).toBe('none');
  });
});
