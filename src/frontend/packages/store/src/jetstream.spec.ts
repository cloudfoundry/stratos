import { describe, expect, it } from 'vitest';
import { extractHttpErrorMessage, stripMarkup } from './jetstream';

describe('stripMarkup', () => {
  it('keeps the words, drops the tags and collapses whitespace', () => {
    expect(stripMarkup('<p>Plan <b>small</b>\n  is   gone</p>')).toBe('Plan small is gone');
    expect(stripMarkup('no markup here')).toBe('no markup here');
  });
});

describe('extractHttpErrorMessage (non-HTTP errors)', () => {
  it('keeps an Error message and a thrown string', () => {
    expect(extractHttpErrorMessage(new Error('boom'))).toBe('boom');
    expect(extractHttpErrorMessage('plain text')).toBe('plain text');
    expect(extractHttpErrorMessage(undefined)).toBe('unknown error');
  });
});
