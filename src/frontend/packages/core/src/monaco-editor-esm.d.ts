// monaco-editor publishes only a `module` entry (no main/exports), so the
// loader imports the concrete ESM file — which ships no declaration of its
// own (only editor.api.d.ts). Its API surface is exactly the package's
// public types.
declare module 'monaco-editor/esm/vs/editor/editor.main.js' {
  export * from 'monaco-editor';
}
