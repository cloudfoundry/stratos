/**
 * Curated Monaco feature subset.
 *
 * This module exists to be the single dynamic-import target of
 * monaco-loader.ts: every feature is a *static* import here so the whole
 * subset lands in one lazy chunk. (Importing each feature dynamically from
 * the loader was measured to split the editor across ~170 micro-chunks,
 * which cost more gzip and requests than the full build it replaced.)
 *
 * The subset replaces monaco's editor.main.js: Stratos edits only json
 * (its language service, below), yaml (tokenizer below; completion/
 * validation/hover come from monaco-yaml) and plaintext (built in), and
 * its three editor surfaces need nowhere near every editor contribution.
 * Each import registers one feature; anything a kept feature needs arrives
 * transitively, so leaving one out only ever prunes, never breaks a kept
 * one. Left out relative to editor.all.js/edcore.main.js: inline
 * completions/edits, semantic tokens, rename, color picker, sticky scroll,
 * parameter hints, inlay hints, linked editing, drag-and-drop & rich
 * paste, the ~80 other bundled languages, the css/html/typescript
 * services, and assorted micro-features with no provider or surface in
 * Stratos. (The diff editor widget is not imported here either, but
 * editor.api.js pulls it in via createDiffEditor — dropping it needs an
 * upstream change.) Re-diff this list against monaco's editor.all.js on
 * every monaco upgrade.
 */
import 'monaco-editor/esm/vs/editor/browser/coreCommands.js';
import 'monaco-editor/esm/vs/editor/browser/widget/codeEditor/codeEditorWidget.js';
import 'monaco-editor/esm/vs/editor/contrib/bracketMatching/browser/bracketMatching.js';
import 'monaco-editor/esm/vs/editor/contrib/clipboard/browser/clipboard.js';
import 'monaco-editor/esm/vs/editor/contrib/codeAction/browser/codeActionContributions.js';
import 'monaco-editor/esm/vs/editor/contrib/codelens/browser/codelensController.js';
import 'monaco-editor/esm/vs/editor/contrib/comment/browser/comment.js';
import 'monaco-editor/esm/vs/editor/contrib/contextmenu/browser/contextmenu.js';
import 'monaco-editor/esm/vs/editor/contrib/cursorUndo/browser/cursorUndo.js';
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js';
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding.js';
import 'monaco-editor/esm/vs/editor/contrib/format/browser/formatActions.js';
import 'monaco-editor/esm/vs/editor/contrib/documentSymbols/browser/documentSymbols.js';
import 'monaco-editor/esm/vs/editor/contrib/gotoSymbol/browser/goToCommands.js';
import 'monaco-editor/esm/vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition.js';
import 'monaco-editor/esm/vs/editor/contrib/gotoError/browser/gotoError.js';
import 'monaco-editor/esm/vs/editor/contrib/hover/browser/hoverContribution.js';
import 'monaco-editor/esm/vs/editor/contrib/indentation/browser/indentation.js';
import 'monaco-editor/esm/vs/editor/contrib/lineSelection/browser/lineSelection.js';
import 'monaco-editor/esm/vs/editor/contrib/linesOperations/browser/linesOperations.js';
import 'monaco-editor/esm/vs/editor/contrib/links/browser/links.js';
import 'monaco-editor/esm/vs/editor/contrib/longLinesHelper/browser/longLinesHelper.js';
import 'monaco-editor/esm/vs/editor/contrib/multicursor/browser/multicursor.js';
import 'monaco-editor/esm/vs/editor/contrib/readOnlyMessage/browser/contribution.js';
import 'monaco-editor/esm/vs/editor/contrib/smartSelect/browser/smartSelect.js';
import 'monaco-editor/esm/vs/editor/contrib/snippet/browser/snippetController2.js';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController.js';
import 'monaco-editor/esm/vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode.js';
import 'monaco-editor/esm/vs/editor/contrib/unicodeHighlighter/browser/unicodeHighlighter.js';
import 'monaco-editor/esm/vs/editor/contrib/unusualLineTerminators/browser/unusualLineTerminators.js';
import 'monaco-editor/esm/vs/editor/contrib/wordHighlighter/browser/wordHighlighter.js';
import 'monaco-editor/esm/vs/editor/contrib/wordOperations/browser/wordOperations.js';
// Standalone-editor extras (edcore.main): quick access (F1 palette,
// Ctrl+G, symbol search) and accessibility helpers.
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js';
// Translated strings and the codicon font styles (suggest/find icons).
import 'monaco-editor/esm/vs/editor/common/standaloneStrings.js';
import 'monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles.js';
// Languages: the json language service and the yaml tokenizer.
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';

export * from 'monaco-editor/esm/vs/editor/editor.api.js';
