// monaco-editor publishes only a `module` entry (no main/exports), so the
// loader imports concrete ESM files — which ship no declarations of their
// own (only editor.api.d.ts). editor.api's surface is exactly the package's
// public types; every other imported file is a side-effect-only feature or
// language contribution, covered by the wildcard below (the specific
// declaration wins where both match).
declare module 'monaco-editor/esm/vs/editor/editor.api.js' {
  export * from 'monaco-editor';
}
declare module 'monaco-editor/esm/*';
