/**
 * Monaco Editor Loader
 *
 * Imports Monaco as ESM through the Angular build: the editor arrives as
 * hashed, lazy chunks like the rest of the app, and its language workers are
 * bundled by the builder from `new Worker(new URL(...))` references —
 * replacing the AMD loader and the copied vs/ asset tree (#5561).
 *
 * Consumers keep using the `monaco` global: the legacy surface predates the
 * ESM import and every call site reads `window.monaco` after awaiting
 * loadMonacoEditor().
 */

import type { languages } from 'monaco-editor';
import type { MonacoYaml, MonacoYamlOptions } from 'monaco-yaml';

let monacoLoad: Promise<void> | null = null;
let monacoYaml: MonacoYaml | null = null;

export function loadMonacoEditor(): Promise<void> {
  if (!monacoLoad) {
    monacoLoad = doLoadMonacoEditor();
    // Allow a retry after a failed load (e.g. transient network error)
    monacoLoad.catch(() => monacoLoad = null);
  }
  return monacoLoad;
}

/**
 * Replace the YAML language configuration (schemas, validation, hover).
 * monaco-yaml v5 configures once and updates via a handle — the old
 * per-call `yamlDefaults.setDiagnosticsOptions` API no longer exists.
 */
export async function configureYaml(options: MonacoYamlOptions): Promise<void> {
  await loadMonacoEditor();
  // Null when a pre-set window.monaco short-circuited the import path (the
  // unit-test mock does this) — yaml configuration is a no-op there.
  if (monacoYaml) {
    await monacoYaml.update(options);
  }
}

/**
 * Replace the JSON diagnostics configuration (schemas, validation). The JSON
 * language service ships with Monaco itself, so unlike YAML this delegates
 * straight to `jsonDefaults` — process-global, last caller wins.
 */
export async function configureJsonDiagnostics(options: languages.json.DiagnosticsOptions): Promise<void> {
  await loadMonacoEditor();
  // Optional-chained: a pre-set window.monaco (the unit-test mock) carries no
  // language services — json configuration is a no-op there, like yaml above.
  (window as any).monaco?.languages?.json?.jsonDefaults?.setDiagnosticsOptions(options);
}

async function doLoadMonacoEditor(): Promise<void> {
  if ((window as any).monaco) {
    return;
  }

  // The builder rewrites each relative `new Worker(new URL(...))` into a
  // hashed lazy chunk of its own; bare package specifiers are not resolved
  // here, hence the local wrapper modules in monaco-workers/ (same pattern
  // as the upstream ESM integration guide, minus Vite's `?worker` sugar).
  // Only the languages Stratos edits get a language worker (json, yaml);
  // everything else falls back to the basic editor worker — add a wrapper
  // in monaco-workers/ if an editor surface for a new language appears.
  (self as any).MonacoEnvironment = {
    getWorker(workerId: string, label: string): Worker {
      switch (label) {
        case 'json':
          return new Worker(new URL('./monaco-workers/json.worker', import.meta.url), { type: 'module' });
        case 'yaml':
          return new Worker(new URL('./monaco-workers/yaml.worker', import.meta.url), { type: 'module' });
        default:
          return new Worker(new URL('./monaco-workers/editor.worker', import.meta.url), { type: 'module' });
      }
    },
  };

  // Explicit file specifier: monaco-editor publishes only a `module` field
  // (no main/exports), which vitest's vite resolver rejects as a bare
  // 'monaco-editor' import while esbuild accepts it — the concrete path
  // resolves identically in both (typed by monaco-editor-esm.d.ts).
  const [monaco, { configureMonacoYaml }] = await Promise.all([
    import('monaco-editor/esm/vs/editor/editor.main.js'),
    import('monaco-yaml'),
  ]);

  // Baseline YAML support (highlighting, indentation-aware completion);
  // schema-driven validation is layered on per-editor via configureYaml().
  monacoYaml = configureMonacoYaml(monaco, { hover: true, completion: true, validate: true });

  (window as any).monaco = monaco;
}
