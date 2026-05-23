import { describe, it, expect } from 'vitest';

import {
  naturalCompare,
  naturalCollator,
  detectSortContext,
  NO_SEPARATOR_PATTERN_THRESHOLD,
} from './natural-sort';

describe('naturalCompare', () => {
  it('sorts numeric segments naturally', () => {
    const input = ['app-1', 'app-10', 'app-2', 'app-20', 'app-3'];
    const sorted = [...input].sort((a, b) => naturalCompare(a, b));
    expect(sorted).toEqual(['app-1', 'app-2', 'app-3', 'app-10', 'app-20']);
  });

  it('handles multiple numeric groups', () => {
    const input = ['v1.10.1', 'v1.2.10', 'v1.2.3', 'v2.1.0'];
    const sorted = [...input].sort((a, b) => naturalCompare(a, b));
    expect(sorted).toEqual(['v1.2.3', 'v1.2.10', 'v1.10.1', 'v2.1.0']);
  });

  it('is case-insensitive by default', () => {
    expect(naturalCompare('App-2', 'app-2')).toBe(0);
    const input = ['App-10', 'app-1', 'APP-2'];
    const sorted = [...input].sort((a, b) => naturalCompare(a, b));
    expect(sorted).toEqual(['app-1', 'APP-2', 'App-10']);
  });

  it('sorts pure alpha strings alphabetically', () => {
    const input = ['cherry', 'apple', 'banana'];
    const sorted = [...input].sort((a, b) => naturalCompare(a, b));
    expect(sorted).toEqual(['apple', 'banana', 'cherry']);
  });

  it('sorts numeric-only strings numerically', () => {
    const input = ['3', '1', '20', '10'];
    const sorted = [...input].sort((a, b) => naturalCompare(a, b));
    expect(sorted).toEqual(['1', '3', '10', '20']);
  });

  it('handles null values without throwing', () => {
    expect(() => naturalCompare(null as any, 'a')).not.toThrow();
    expect(() => naturalCompare('a', null as any)).not.toThrow();
    expect(() => naturalCompare(null as any, null as any)).not.toThrow();
  });

  it('handles empty strings', () => {
    expect(naturalCompare('', '')).toBe(0);
    expect(naturalCompare('', 'a')).toBeLessThan(0);
  });

  describe('missing-token decision table', () => {
    // The interesting case: a bare-prefix value (no number at a token
    // position) compared against a sibling that does carry a number.
    //
    //                 MatchCase ON       MatchCase OFF
    //     ASC         smallest (-∞)      empty (lex)
    //     DESC        largest  (+∞)      empty (lex)
    //
    // With MatchCase ON the bare-prefix is PINNED to the head of its
    // numeric siblings regardless of direction. With OFF it just rides
    // lex continuation.

    const input = ['org_2', 'org_', 'org_1', 'org_10'];

    it('MatchCase OFF + ASC → bare prefix first (lex: shorter wins ASC)', () => {
      const sorted = [...input].sort((a, b) => naturalCompare(a, b, false, 'asc'));
      expect(sorted).toEqual(['org_', 'org_1', 'org_2', 'org_10']);
    });

    it('MatchCase OFF + DESC → bare prefix last (lex: shorter loses DESC)', () => {
      const sorted = [...input].sort((a, b) => naturalCompare(a, b, false, 'desc'));
      expect(sorted).toEqual(['org_10', 'org_2', 'org_1', 'org_']);
    });

    it('MatchCase ON + ASC → bare prefix at head (smallest = -∞)', () => {
      const sorted = [...input].sort((a, b) => naturalCompare(a, b, true, 'asc'));
      expect(sorted).toEqual(['org_', 'org_1', 'org_2', 'org_10']);
    });

    it('MatchCase ON + DESC → bare prefix still at head (largest = +∞)', () => {
      const sorted = [...input].sort((a, b) => naturalCompare(a, b, true, 'desc'));
      expect(sorted).toEqual(['org_', 'org_10', 'org_2', 'org_1']);
    });
  });

  describe('case-sensitive mode (locale-aware)', () => {
    it('reorders strings that differ only in case', () => {
      const off = naturalCompare('Apple', 'apple', false);
      const on  = naturalCompare('Apple', 'apple', true);
      expect(off).toBe(0);
      expect(on).not.toBe(0);
    });

    it('still equates strings that match exactly under match-case', () => {
      expect(naturalCompare('Apple', 'Apple', true)).toBe(0);
      expect(naturalCompare('apple', 'apple', true)).toBe(0);
    });
  });

  describe('direction handling', () => {
    it('reverses the result when direction is desc', () => {
      const asc = naturalCompare('a', 'b', false, 'asc');
      const desc = naturalCompare('a', 'b', false, 'desc');
      expect(asc).toBeLessThan(0);
      expect(desc).toBeGreaterThan(0);
    });

    it('sorts numbers descending when direction is desc', () => {
      const sorted = ['org_1', 'org_3', 'org_2', 'org_10']
        .sort((a, b) => naturalCompare(a, b, false, 'desc'));
      expect(sorted).toEqual(['org_10', 'org_3', 'org_2', 'org_1']);
    });
  });

  describe('cross-type tokens', () => {
    it('treats numeric-led values as sorting before letter-led values', () => {
      const sorted = ['org', '1org', 'a-org'].sort((a, b) => naturalCompare(a, b));
      expect(sorted[0]).toBe('1org');
    });
  });

  describe('stripSeparators ctx (collection-aware)', () => {
    // The user-asked case: Org 3, Org_4, Org5 should sequence together
    // by their numeric token even though they use different (or no)
    // separator characters. With stripSeparators on, separators are
    // stripped before tokenization so all three collapse to [Org, N].

    it('sequences Org 3 / Org_4 / Org5 by their number when stripSeparators is on', () => {
      const ctx = { stripSeparators: true };
      const sorted = ['Org5', 'Org 3', 'Org_4'].sort(
        (a, b) => naturalCompare(a, b, false, 'asc', ctx),
      );
      expect(sorted).toEqual(['Org 3', 'Org_4', 'Org5']);
    });

    it('keeps the original separator-divergent order when stripSeparators is off', () => {
      // Without stripping, the trailing separator chars become part of
      // each text token, so the strings diverge before the numeric
      // tokens are reached. Locale base sensitivity puts '_' before
      // digits before spaces — exact ordering is implementation-
      // dependent, but the entries no longer sequence purely by number.
      const sorted = ['Org5', 'Org 3', 'Org_4'].sort(
        (a, b) => naturalCompare(a, b, false, 'asc'),
      );
      expect(sorted).not.toEqual(['Org 3', 'Org_4', 'Org5']);
    });
  });
});

describe('detectSortContext', () => {
  it('flips stripSeparators on when most values are xxx-sep?-nnn', () => {
    const values = ['org_1', 'org_2', 'org_10', 'org 5', 'org7'];
    const ctx = detectSortContext(values);
    expect(ctx.stripSeparators).toBe(true);
  });

  it('keeps stripSeparators off when only outliers carry digits', () => {
    const values = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'Org4'];
    const ctx = detectSortContext(values);
    expect(ctx.stripSeparators).toBe(false);
  });

  it('treats empty / null entries as not contributing to the count', () => {
    const values = ['', '', 'org_1', 'org_2'];
    const ctx = detectSortContext(values);
    expect(ctx.stripSeparators).toBe(true);
  });

  it('returns stripSeparators undefined / false for empty input', () => {
    const ctx = detectSortContext([]);
    expect(ctx.stripSeparators).toBeFalsy();
  });
});

describe('end-to-end: collection-aware sort flows', () => {
  it('sequences Org 3, Org_4, Org5 in a mixed-separator collection', () => {
    const values = ['Org 3', 'Org_4', 'Org5', 'Org_2', 'Org 1'];
    const ctx = detectSortContext(values);
    expect(ctx.stripSeparators).toBe(true);
    const sorted = [...values].sort(
      (a, b) => naturalCompare(a, b, false, 'asc', ctx),
    );
    expect(sorted).toEqual(['Org 1', 'Org_2', 'Org 3', 'Org_4', 'Org5']);
  });
});

describe('naturalCollator (legacy compat export)', () => {
  it('is an Intl.Collator instance', () => {
    expect(naturalCollator).toBeInstanceOf(Intl.Collator);
  });
});

describe('NO_SEPARATOR_PATTERN_THRESHOLD', () => {
  it('is a fraction in [0, 1]', () => {
    expect(NO_SEPARATOR_PATTERN_THRESHOLD).toBeGreaterThanOrEqual(0);
    expect(NO_SEPARATOR_PATTERN_THRESHOLD).toBeLessThanOrEqual(1);
  });
});
