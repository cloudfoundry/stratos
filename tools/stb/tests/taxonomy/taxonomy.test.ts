import { describe, it, expect } from 'vitest';
import { extractTerms } from '@/taxonomy/taxonomy';

const tax = { terms: [
  { term: 'login', label: 'Login page' },
  { term: 'background', label: 'Background' },
  { term: 'title', label: 'Title' },
] };

describe('extractTerms', () => {
  it('matches registered whole-word terms, ignoring connectives', () => {
    expect(extractTerms('background for the login page of sunset', tax))
      .toEqual(['background', 'login']);
  });

  it('does not match substrings', () => {
    // 'logins' must not match 'login'; 'subtitle' must not match 'title'
    expect(extractTerms('subtitle for logins', tax)).toEqual([]);
  });

  it('dedupes repeats', () => {
    expect(extractTerms('login login title', tax)).toEqual(['login', 'title']);
  });
});
