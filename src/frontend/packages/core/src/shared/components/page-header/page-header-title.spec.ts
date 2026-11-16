/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest';

// The page header shows the page's title, which is the page's only h1: a
// screen reader user jumps to it by heading and hears what the page is
// (WCAG 2.4.6). A title given to <app-page-header> as bare text is not a
// heading, so every template has to wrap it in an h1.
const templates = import.meta.glob('../../../../../*/src/**/*.component.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('page header titles', () => {
  it('finds the templates', () => {
    expect(Object.keys(templates).length).toBeGreaterThan(100);
  });

  it('gives every page header title an h1', () => {
    const bare: string[] = [];
    for (const [file, html] of Object.entries(templates)) {
      for (const m of html.matchAll(/<app-page-header\b[^>]*>([\s\S]*?)<\/app-page-header>/g)) {
        // The title is the first content after any comments and @if
        // openers: text before any element, or an interpolation such as
        // {{ title() }}.
        let first = m[1].trim();
        for (;;) {
          if (first.startsWith('<!--')) {
            first = first.slice(first.indexOf('-->') + 3).trimStart();
          } else if (/^@(if|else)\b[^{]*\{/.test(first)) {
            first = first.slice(first.indexOf('{') + 1).trimStart();
          } else {
            break;
          }
        }
        if (first && !first.startsWith('<')) {
          bare.push(`${file.replace(/^(\.\.\/)+/, '')}: ${first.split('\n')[0].trim()}`);
        }
      }
    }
    expect(bare).toEqual([]);
  });
});
