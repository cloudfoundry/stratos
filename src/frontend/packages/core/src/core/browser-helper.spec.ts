import { describe, expect, it, vi } from 'vitest';

import { KEEP_CLASS_ATTRIBUTE, setSanitizedHTML } from './browser-helper';

describe('setSanitizedHTML', () => {

  it('prefers setHTML, and hands it the options it was given', () => {
    const el = document.createElement('div');
    const setHTML = vi.fn();
    (el as any).setHTML = setHTML;

    setSanitizedHTML(el, '<b>x</b>', KEEP_CLASS_ATTRIBUTE);

    expect(setHTML).toHaveBeenCalledWith('<b>x</b>', KEEP_CLASS_ATTRIBUTE);
    expect(el.innerHTML).toBe('');
  });

  // Firefox and Safari have no setHTML. They have no Trusted Types either, so
  // innerHTML is exactly as safe there as it was before this function existed —
  // which is why every caller still owes its input its own vetting.
  it('falls back to innerHTML where setHTML does not exist', () => {
    const el = document.createElement('div');
    expect((el as any).setHTML).toBeUndefined();

    setSanitizedHTML(el, '<span class="ansi-red">boom</span>');

    expect(el.querySelector('span')?.className).toBe('ansi-red');
    expect(el.textContent).toBe('boom');
  });

  it('replaces existing content rather than appending to it', () => {
    const el = document.createElement('div');
    el.appendChild(document.createElement('p'));

    setSanitizedHTML(el, '<b>second</b>');

    expect(el.querySelector('p')).toBeNull();
    expect(el.innerHTML).toBe('<b>second</b>');
  });

  // The log viewer's colours are entirely class-driven, and setHTML's default
  // sanitizer drops class along with everything else it does not recognise.
  it('asks for the class attribute the log colours depend on', () => {
    expect(KEEP_CLASS_ATTRIBUTE).toEqual({ sanitizer: { allowAttributes: { class: ['*'] } } });
  });
});

// What this file cannot show: that setHTML is exempt from
// require-trusted-types-for while innerHTML, DOMParser.parseFromString,
// Range.createContextualFragment, <template>.innerHTML and setHTMLUnsafe are
// all refused under it. jsdom implements neither Trusted Types nor setHTML, so
// that property — the one this function exists for — is only observable in a
// browser against the built UI, which is where it was measured.
