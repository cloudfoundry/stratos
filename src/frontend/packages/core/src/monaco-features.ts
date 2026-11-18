/**
 * Curated Monaco feature subset.
 *
 * This module exists to be the single dynamic-import target of
 * monaco-loader.ts: every feature is a *static* import here so the whole
 * subset lands in one lazy chunk. (Importing each feature dynamically from
 * the loader was measured to split the editor across ~170 micro-chunks,
 * which cost more gzip and requests than the full build it replaced.)
 *
 * The subset replaces monaco's full build: Stratos edits only json (its
 * language service, below), yaml (tokenizer below; completion/validation/
 * hover come from monaco-yaml) and plaintext (built in), and its three
 * editor surfaces need nowhere near every editor feature. Each import
 * registers one feature; anything a kept feature needs arrives
 * transitively, so leaving one out only ever prunes, never breaks a kept
 * one. Left out relative to monaco's features/register.all.js: inline
 * completions, semantic tokens, rename, color picker, sticky scroll,
 * parameter hints, inlay hints, linked editing, drag-and-drop & rich
 * paste (drop-into-editor is kept; see below), the ~80 other bundled languages, the css/html/typescript
 * services, and assorted micro-features with no provider or surface in
 * Stratos. (The diff editor widget is not imported here either, but
 * editor.js pulls it in via createDiffEditor — dropping it needs an
 * upstream change.) Re-diff this list against features/register.all.js
 * on every monaco upgrade, and compare the editor chunk's size before and
 * after against the anyScript budget in angular.json: an upgrade that
 * grows the chunk past it fails the production build.
 */
import 'monaco-editor/editor/browser/coreCommands.js';
import 'monaco-editor/features/codeEditor/register.js';
import 'monaco-editor/features/bracketMatching/register.js';
import 'monaco-editor/features/clipboard/register.js';
import 'monaco-editor/features/codeAction/register.js';
import 'monaco-editor/features/codelens/register.js';
import 'monaco-editor/features/comment/register.js';
import 'monaco-editor/features/contextmenu/register.js';
import 'monaco-editor/features/cursorUndo/register.js';
import 'monaco-editor/features/find/register.js';
import 'monaco-editor/features/folding/register.js';
import 'monaco-editor/features/format/register.js';
import 'monaco-editor/features/documentSymbols/register.js';
import 'monaco-editor/features/gotoSymbol/register.js';
import 'monaco-editor/features/gotoError/register.js';
import 'monaco-editor/features/hover/register.js';
import 'monaco-editor/features/indentation/register.js';
import 'monaco-editor/features/lineSelection/register.js';
import 'monaco-editor/features/linesOperations/register.js';
import 'monaco-editor/features/links/register.js';
import 'monaco-editor/features/longLinesHelper/register.js';
import 'monaco-editor/features/multicursor/register.js';
import 'monaco-editor/features/readOnlyMessage/register.js';
import 'monaco-editor/features/smartSelect/register.js';
import 'monaco-editor/features/snippet/register.js';
import 'monaco-editor/features/suggest/register.js';
// monaco 0.56's feature registry omits the suggest CONTROLLER and the
// go-to commands: features/suggest/register.js (and register.all.js)
// import only suggestInlineCompletions, and features/gotoSymbol only the
// mouse link path — upstream's editor.main.js imports both directly, so
// only registry-composed builds lose completions and F12. Verified live:
// without these, editor.action.triggerSuggest does not exist. Import the
// contribs directly until upstream fixes the registry.
import 'monaco-editor/editor/contrib/suggest/browser/suggestController.js';
import 'monaco-editor/editor/contrib/gotoSymbol/browser/goToCommands.js';
// Drop-into-editor cannot be left out: the json language support loads on
// first use, and the module that starts its worker (internal/common/
// workers.js) imports most editor features as a side effect, this one
// included. Arriving that late, the feature registers its controller but
// its treeViewsDndService misses the editor services, which are fixed when
// the first editor starts, so every editor created afterwards logs
// "depends on UNKNOWN service". Registering it here, before any editor,
// keeps the service in. The same late import brings the other left-out
// features to editors created after json loads; only this one failed.
// The e2e Monaco smoke test creates an editor after json loads and fails
// on any such error, so a monaco upgrade that adds another shows there.
// Upstream: microsoft/monaco-editor#5507 (fix proposed in #5508); once a
// release carries it, json no longer brings features and this import is
// a choice again.
import 'monaco-editor/features/dropOrPasteInto/register.js';
import 'monaco-editor/features/toggleTabFocusMode/register.js';
import 'monaco-editor/features/unicodeHighlighter/register.js';
import 'monaco-editor/features/unusualLineTerminators/register.js';
import 'monaco-editor/features/wordHighlighter/register.js';
import 'monaco-editor/features/wordOperations/register.js';
// Standalone-editor extras: quick access (F1 palette, Ctrl+G, symbol
// search) and accessibility helpers.
import 'monaco-editor/features/iPadShowKeyboard/register.js';
import 'monaco-editor/features/quickHelp/register.js';
import 'monaco-editor/features/gotoLine/register.js';
import 'monaco-editor/features/quickOutline/register.js';
import 'monaco-editor/features/quickCommand/register.js';
import 'monaco-editor/features/toggleHighContrast/register.js';
// The codicon icon styles (suggest/find widget icons).
import 'monaco-editor/features/codicon/register.js';
// Languages: the json language service and the yaml tokenizer.
import 'monaco-editor/languages/definitions/yaml/register.js';
export { jsonDefaults } from 'monaco-editor/languages/features/json/register.js';

export * from 'monaco-editor/editor.js';
