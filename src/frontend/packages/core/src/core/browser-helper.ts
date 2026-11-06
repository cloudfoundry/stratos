export const getEventTarget = (event: Event): EventTarget | null => {
  // Ensure we work on Firefox as well as Chrome etc
  return event.target || (event as any).srcElement;
};

export const getEventFiles = (event: Event): FileList | null => {
  const target = getEventTarget(event) as HTMLInputElement;
  return target?.files || null;
};

/**
 * Sanitizer options for markup whose meaning lives in its class attribute —
 * the log viewer's ANSI colours, which setHTML would otherwise strip along
 * with everything else it does not recognise.
 */
export const KEEP_CLASS_ATTRIBUTE = { sanitizer: { allowAttributes: { class: ['*'] } } };

/**
 * Sets el's content from a markup string, sanitizing it, and without tripping
 * require-trusted-types-for 'script'.
 *
 * innerHTML is an injection sink: under that directive the browser refuses a
 * plain string outright and throws a TypeError. So are the obvious ways around
 * it — measured in Chrome under the shipped policy, DOMParser.parseFromString,
 * Range.createContextualFragment, <template>.innerHTML and setHTMLUnsafe are
 * all refused exactly the same way. Building the nodes elsewhere and adopting
 * them is not an escape, because there is nowhere else to build them.
 *
 * setHTML is the one route the platform leaves open, and it is open precisely
 * because it sanitizes: it parses the markup and drops what could execute. That
 * is why it needs no Trusted Types policy, and why Stratos defines none for
 * HTML — a policy whose createHTML returns its argument unchanged would satisfy
 * the browser while checking nothing, which is worse than having none at all.
 * (There is one policy in the console, in monaco-loader.ts, for worker script
 * URLs, where the platform offers no sanitizing alternative. It checks origin.)
 *
 * Callers still owe their own vetting for the fallback path. Trusted Types and
 * setHTML have so far arrived in the same browsers, so where the directive is
 * enforced this never falls back; where setHTML is missing the directive is not
 * enforced either, and innerHTML behaves as it always did. If that pairing ever
 * comes apart, the fallback throws and the violation is reported.
 */
export const setSanitizedHTML = (el: Element, html: string, options?: unknown): void => {
  const setHTML = (el as unknown as { setHTML?: (h: string, o?: unknown) => void }).setHTML;
  if (typeof setHTML === 'function') {
    setHTML.call(el, html, options);
    return;
  }
  el.innerHTML = html;
};
