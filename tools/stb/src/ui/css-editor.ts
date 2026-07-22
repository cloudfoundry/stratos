import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { css } from '@codemirror/lang-css';

// A CodeMirror CSS editor. Shared by the token editor (editor-pane) and the
// per-element scoped-block editor (lever popover). Returns the EditorView so
// callers can push external changes (editor-pane) or destroy it on close.
export function mountCssEditor(
  host: HTMLElement,
  initial: string,
  onChange: (doc: string) => void,
): EditorView {
  return new EditorView({
    parent: host,
    state: EditorState.create({
      doc: initial,
      extensions: [
        basicSetup,
        css(),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChange(u.state.doc.toString());
        }),
      ],
    }),
  });
}
