import { describe, it, expect } from 'vitest';

// Loads the real login snapshot in an iframe, clicks the primary button,
// and asserts the shim reports a semantic snapshotId (not the tag fallback).
describe('shim reports snapshotId', () => {
  it('posts snapshotId for an instrumented element', async () => {
    const iframe = document.createElement('iframe');
    iframe.src = '/snapshots/v1/login/index.html';
    document.body.appendChild(iframe);
    await new Promise<void>((res) => {
      window.addEventListener('message', function onReady(e) {
        if (e.data?.type === 'STB_PREVIEW_READY') { window.removeEventListener('message', onReady); res(); }
      });
    });
    const got = new Promise<any>((res) => {
      window.addEventListener('message', function onSel(e) {
        if (e.data?.type === 'STB_ELEMENT_SELECTED') { window.removeEventListener('message', onSel); res(e.data); }
      });
    });
    const btn = iframe.contentDocument!.querySelector('[stb-snapshot-id="auth.login.sign-in"]') as HTMLElement;
    btn.click();
    const msg = await got;
    expect(msg.snapshotId).toBe('auth.login.sign-in');
  });
});
