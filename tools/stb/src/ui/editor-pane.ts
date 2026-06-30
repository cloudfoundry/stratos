import type { EditorView } from 'codemirror';
import { effect } from '@preact/signals-core';
import { parseCss } from '@/parse/css-parser';
import { emitCss } from '@/parse/css-emitter';
import { mountCssEditor } from '@/ui/css-editor';
import { rootValues, darkValues } from '@/state/tokens';

const DEBOUNCE_MS = 150;

export function mountEditorPane(host: HTMLElement): EditorView {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let suppressNextChange = false;

  const onDocChange = (doc: string) => {
    if (suppressNextChange) {
      suppressNextChange = false;
      return;
    }
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      const parsed = parseCss(doc);
      rootValues.value = parsed.root;
      darkValues.value = parsed.dark;
    }, DEBOUNCE_MS);
  };

  const initial = emitCss(rootValues.value, darkValues.value);

  const view = mountCssEditor(host, initial, onDocChange);

  effect(() => {
    const desired = emitCss(rootValues.value, darkValues.value);
    if (view.state.doc.toString() === desired) return;
    suppressNextChange = true;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: desired },
    });
  });

  return view;
}
