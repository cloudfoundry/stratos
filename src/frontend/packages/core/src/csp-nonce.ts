/**
 * Applies the per-response CSP nonce to the <style> elements the application
 * creates at runtime, so that style-src-elem can be enforced without
 * 'unsafe-inline'.
 *
 * Monaco and xterm both inject <style> elements and neither accepts a nonce
 * (cloudfoundry/stratos#5705), so there is no per-library seam to plumb one
 * through. createElement is the call they do share.
 *
 * This is narrower than 'unsafe-inline'. Only styles created through the DOM
 * API are nonced; a <style> arriving as markup — innerHTML, an injected
 * fragment — never passes through createElement and stays blocked, which is
 * the injection vector a nonced style-src-elem exists to close.
 */

/**
 * installStyleNonce patches document.createElement so the <style> elements it
 * returns carry the document's CSP nonce.
 *
 * The nonce is read from the ngCspNonce attribute Jetstream injects on
 * <app-root>, using the same lookup Angular's own CSP_NONCE performs, so one
 * server-injected value serves both. Jetstream stamps it on every document it
 * serves, including when CSP is switched off — a nonce with no policy behind
 * it is inert, so the patch installs there and does nothing observable. It is
 * absent under `ng serve`, which serves index.html itself and never reaches
 * Jetstream's document handler; with no nonce to apply, createElement is left
 * alone entirely.
 *
 * Three details decide whether the nonce actually works:
 *
 * - It is set at creation, before insertion. A nonce set on an already
 *   inserted <style> leaves its .sheet null permanently, so the rules never
 *   apply while the element still looks correct in the inspector.
 * - It is set as an attribute rather than through the .nonce property, because
 *   only the attribute survives cloneNode.
 * - It patches this document rather than Document.prototype. Every caller
 *   reaches createElement through the document object — directly, or as the
 *   ownerDocument of an element or shadow root — so the instance is the
 *   narrower target that still covers all of them, and other documents keep
 *   the unpatched method.
 */
export function installStyleNonce(): void {
  const nonce = document.body?.querySelector('[ngCspNonce]')?.getAttribute('ngCspNonce');
  if (!nonce) {
    return;
  }

  const createElement = document.createElement.bind(document);
  document.createElement = function (tagName: string, options?: ElementCreationOptions) {
    const element = createElement(tagName, options);
    if (element instanceof HTMLStyleElement) {
      element.setAttribute('nonce', nonce);
    }
    return element;
  } as typeof document.createElement;
}
