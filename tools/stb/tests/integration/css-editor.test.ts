import { describe, it, expect } from 'vitest';
import { mountCssEditor } from '@/ui/css-editor';

describe('mountCssEditor', () => {
  it('seeds the editor with the initial CSS', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const view = mountCssEditor(host, 'font-size: 18px', () => {});
    expect(view.state.doc.toString()).toBe('font-size: 18px');
    view.destroy();
    host.remove();
  });

  it('fires onChange with the new document when it changes', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let captured = '';
    const view = mountCssEditor(host, 'a: 1', (css) => { captured = css; });
    view.dispatch({ changes: { from: view.state.doc.length, insert: '; b: 2' } });
    expect(captured).toBe('a: 1; b: 2');
    view.destroy();
    host.remove();
  });
});
