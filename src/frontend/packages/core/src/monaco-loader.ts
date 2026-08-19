/**
 * Monaco Editor Loader
 *
 * Imports Monaco as ESM through the Angular build: the editor arrives as
 * hashed, lazy chunks like the rest of the app, and its language workers are
 * bundled by the builder from `new Worker(new URL(...))` references —
 * replacing the AMD loader and the copied vs/ asset tree (#5561).
 *
 * loadMonacoEditor() resolves to the monaco API instance and app code uses
 * that. `window.monaco` is still published as a legacy surface: the e2e
 * smoke test reads it and the unit-test mocks pre-set it to short-circuit
 * the import path.
 */

import type { languages } from 'monaco-editor';
import type { MonacoYaml, MonacoYamlOptions } from 'monaco-yaml';

type MonacoApi = typeof import('monaco-editor');

let monacoLoad: Promise<MonacoApi> | null = null;
let monacoYaml: MonacoYaml | null = null;

/**
 * Installs the document's default Trusted Types policy for worker script URLs.
 *
 * The Worker constructor is a script sink, so under
 * require-trusted-types-for 'script' it refuses a plain URL. Monaco carries its
 * own policy for the workers it starts itself, but the MonacoEnvironment below
 * replaces that path wholesale — nothing Monaco does covers a worker Stratos
 * constructs, so the obligation lands here.
 *
 * It has to be the *default* policy rather than a named one the call sites use.
 * The builder recognises `new Worker(new URL('./x', import.meta.url))`
 * syntactically and emits a hashed chunk for each; wrapping the URL in anything
 * at all breaks that recognition, and the workers then stop being built —
 * measured, the emitted worker chunks went from present to absent. There is
 * nowhere to put an explicit policy without losing the workers themselves.
 *
 * It defines createScriptURL and nothing else, so it does not soften the sinks
 * this directive exists to close: a plain string assigned to innerHTML still
 * finds no createHTML here and is still refused.
 *
 * The origin check is not ceremony. A policy that returned its argument
 * unchanged would satisfy the browser while checking nothing, which is worse
 * than no policy, and worker-src 'self' is a second lock on the same door
 * rather than a reason to leave this one open.
 */
export function installWorkerURLPolicy(): void {
  const trustedTypes = (window as any).trustedTypes;
  if (!trustedTypes?.createPolicy || trustedTypes.defaultPolicy) {
    return;
  }
  trustedTypes.createPolicy('default', {
    createScriptURL: (candidate: string) => {
      if (new URL(candidate, window.location.href).origin !== window.location.origin) {
        throw new Error(`Refusing to start a worker from ${candidate}`);
      }
      return candidate;
    },
  });
}

export function loadMonacoEditor(): Promise<MonacoApi> {
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
  const monaco = await loadMonacoEditor();
  // Optional-chained: a pre-set window.monaco (the unit-test mock) carries no
  // language services — json configuration is a no-op there, like yaml above.
  (monaco as any)?.languages?.json?.jsonDefaults?.setDiagnosticsOptions(options);
}

async function doLoadMonacoEditor(): Promise<MonacoApi> {
  if ((window as any).monaco) {
    return (window as any).monaco;
  }

  // The builder rewrites each relative `new Worker(new URL(...))` into a
  // hashed lazy chunk of its own; bare package specifiers are not resolved
  // here, hence the local wrapper modules in monaco-workers/ (same pattern
  // as the upstream ESM integration guide, minus Vite's `?worker` sugar).
  // Only the languages Stratos edits get a language worker (json, yaml);
  // everything else falls back to the basic editor worker — add a wrapper
  // in monaco-workers/ if an editor surface for a new language appears.
  installWorkerURLPolicy();

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

  // monaco-features re-exports editor.api after statically importing the
  // curated feature/language subset (see its header for what is in and out,
  // and why it must be one dynamic-import target rather than per-feature
  // dynamic imports). monaco-yaml rides the same await so a failure of
  // either leaves the loader retryable as one unit.
  const [monaco, { configureMonacoYaml }] = await Promise.all([
    import('./monaco-features'),
    import('monaco-yaml'),
  ]);

  // Baseline YAML support (indentation-aware completion, hover);
  // schema-driven validation is layered on per-editor via configureYaml().
  monacoYaml = configureMonacoYaml(monaco, { hover: true, completion: true, validate: true });

  (window as any).monaco = monaco;
  return monaco;
}
