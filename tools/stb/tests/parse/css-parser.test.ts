import { describe, it, expect } from 'vitest';
import { parseCss } from '@/parse/css-parser';

describe('parseCss', () => {
  it('extracts :root variables', () => {
    const css = `
      :root {
        --color-brand-500: #1e88e5;
        --color-brand-600: #1976d2;
      }
    `;
    const result = parseCss(css);
    expect(result.root.get('--color-brand-500')).toBe('#1e88e5');
    expect(result.root.get('--color-brand-600')).toBe('#1976d2');
    expect(result.dark.size).toBe(0);
  });

  it('extracts .dark-theme variables', () => {
    const css = `
      :root { --color-brand-500: #aaa; }
      .dark-theme { --color-brand-500: #bbb; }
    `;
    const result = parseCss(css);
    expect(result.root.get('--color-brand-500')).toBe('#aaa');
    expect(result.dark.get('--color-brand-500')).toBe('#bbb');
  });

  it('ignores non-variable declarations', () => {
    const css = `
      :root {
        --color-brand-500: #aaa;
        color: red;
        background: blue;
      }
    `;
    const result = parseCss(css);
    expect(result.root.size).toBe(1);
    expect(result.root.get('--color-brand-500')).toBe('#aaa');
  });

  it('handles values with spaces and parens', () => {
    const css = `:root {
      --color-brand-500: rgb(30 136 229);
      --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }`;
    const result = parseCss(css);
    expect(result.root.get('--color-brand-500')).toBe('rgb(30 136 229)');
    expect(result.root.get('--shadow')).toBe('0 1px 3px rgba(0, 0, 0, 0.1)');
  });

  it('handles empty input', () => {
    const result = parseCss('');
    expect(result.root.size).toBe(0);
    expect(result.dark.size).toBe(0);
  });

  it('ignores comments', () => {
    const css = `
      :root {
        /* a comment */
        --color-brand-500: #aaa; /* trailing */
      }
    `;
    const result = parseCss(css);
    expect(result.root.get('--color-brand-500')).toBe('#aaa');
  });
});
