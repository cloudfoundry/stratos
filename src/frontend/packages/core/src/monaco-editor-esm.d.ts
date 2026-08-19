// monaco-editor 0.53+ resolves subpaths through its exports map and ships
// per-file declarations for its public entry points (editor.js, the
// features/*/register.js modules, the language registers). Some internal
// files a feature list reaches for (e.g. editor/browser/coreCommands.js)
// have no declaration of their own — this wildcard types those side-effect
// imports; any specifier with a real .d.ts wins over it.
declare module 'monaco-editor/*';
