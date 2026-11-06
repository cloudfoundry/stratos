import { afterEach, describe, expect, it } from 'vitest';

import { installStyleNonce } from './csp-nonce';

// installStyleNonce patches the shared document, so every test puts it back.
// Without this the patches stack and a later assertion passes on an earlier
// test's nonce. Deleting the own property restores the inherited method.
describe('installStyleNonce', () => {
  const inheritedCreateElement = document.createElement;

  afterEach(() => {
    delete (document as Partial<Document>).createElement;
    document.body.innerHTML = '';
  });

  const withNoncedAppRoot = (nonce: string) => {
    document.body.innerHTML = `<app-root ngCspNonce="${nonce}"></app-root>`;
  };

  it('nonces a style element from the ngCspNonce Jetstream injected', () => {
    withNoncedAppRoot('N1');
    installStyleNonce();

    expect(document.createElement('style').getAttribute('nonce')).toBe('N1');
  });

  // The nonce has to be on the element before it is inserted, or its .sheet
  // stays null and the rules never apply. Asserting on the attribute alone
  // would still pass if the nonce were applied on insertion instead.
  it('nonces the element at creation, before it is inserted', () => {
    withNoncedAppRoot('N1');
    installStyleNonce();

    const style = document.createElement('style');

    expect(style.isConnected).toBe(false);
    expect(style.getAttribute('nonce')).toBe('N1');
  });

  // Monaco clones style elements into shadow roots. The .nonce property does
  // not survive cloneNode; the attribute does.
  it('carries the nonce through cloneNode', () => {
    withNoncedAppRoot('N1');
    installStyleNonce();

    const clone = document.createElement('style').cloneNode(true) as Element;

    expect(clone.getAttribute('nonce')).toBe('N1');
  });

  it('leaves other elements alone', () => {
    withNoncedAppRoot('N1');
    installStyleNonce();

    expect(document.createElement('div').hasAttribute('nonce')).toBe(false);
  });

  // CSP off, or `ng serve` — which serves index.html itself, so Jetstream never
  // stamps it. Nothing to apply, so nothing is patched at all.
  it('does not patch createElement when the document carries no nonce', () => {
    document.body.innerHTML = '<app-root></app-root>';

    installStyleNonce();

    expect(document.createElement).toBe(inheritedCreateElement);
  });
});
