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
  it('applies a composed multi-layer background (color + reversed layers)', () => {
    const d = doc('<div stb-snapshot-id="a.card"></div>');
    applyLevers(d, [{
      snapshotId: 'a.card',
      kind: 'background',
      backgroundColor: '#0b3d91',
      backgroundImage: 'linear-gradient(rgba(0,0,0,.6), transparent), url(assets/hero.jpg)',
    }]);
    const el = d.querySelector('[stb-snapshot-id="a.card"]') as HTMLElement;
    expect(el.style.backgroundColor).toBeTruthy();
    // jsdom's CSSOM re-serializes url(...) with quotes (`url("assets/hero.jpg")`) — assert on
    // the ref substring rather than the exact unquoted form so this isn't jsdom-quirk-fragile.
    expect(el.style.backgroundImage).toContain('assets/hero.jpg');
  });
  it('clears a previously applied inline background-image when the patch omits it (last layer removed)', () => {
    const d = doc('<div stb-snapshot-id="a.card"></div>');
    const el = d.querySelector('[stb-snapshot-id="a.card"]') as HTMLElement;
    applyLevers(d, [{ snapshotId: 'a.card', kind: 'background', backgroundColor: '#0b3d91', backgroundImage: 'url(assets/hero.jpg)' }]);
    expect(el.style.backgroundImage).toContain('assets/hero.jpg');
    // last layer removed: the background patch is still present but has no image component
    applyLevers(d, [{ snapshotId: 'a.card', kind: 'background', backgroundColor: '#0b3d91' }]);
    expect(el.style.backgroundImage).toBe('');
    expect(el.style.backgroundColor).toBeTruthy();
  });
  it('leaves inline background untouched when no background patch is present (scoped/dark CSS owns it)', () => {
    const d = doc('<div stb-snapshot-id="a.card">x</div>');
    const el = d.querySelector('[stb-snapshot-id="a.card"]') as HTMLElement;
    applyLevers(d, [{ snapshotId: 'a.card', kind: 'background', backgroundColor: '#0b3d91', backgroundImage: 'url(assets/hero.jpg)' }]);
    // a later batch WITHOUT a background patch (e.g. dark mode with no dark override)
    // must not clear what it did not set
    applyLevers(d, [{ snapshotId: 'a.card', kind: 'content', text: 'y' }]);
    expect(el.style.backgroundImage).toContain('assets/hero.jpg');
    expect(el.style.backgroundColor).toBeTruthy();
  });
});
