import { afterEach, describe, expect, it, vi } from 'vitest';

import { configureJsonDiagnostics, installWorkerURLPolicy, withLegacyWorkerFactory } from './monaco-loader';

// Resolves to the window.monaco mock installed by test-setup. The mock
// carries no language services, so jsonDefaults is absent by default —
// tests that assert forwarding install it and remove it again afterwards.
declare const monaco: { jsonDefaults?: unknown };

describe('configureJsonDiagnostics', () => {
  afterEach(() => {
    delete (monaco as any).jsonDefaults;
  });

  it('forwards the options to jsonDefaults.setDiagnosticsOptions', async () => {
    const setDiagnosticsOptions = vi.fn();
    (monaco as any).jsonDefaults = { setDiagnosticsOptions };

    const options = {
      validate: true,
      schemas: [{
        uri: 'https://example.com/schema.json',
        fileMatch: ['*'],
        schema: { type: 'object' },
      }],
    };
    await configureJsonDiagnostics(options);

    expect(setDiagnosticsOptions).toHaveBeenCalledWith(options);
  });

  it('resolves when the json language service is absent (the mock default)', async () => {
    await expect(configureJsonDiagnostics({ validate: true })).resolves.toBeUndefined();
  });
});

describe('installWorkerURLPolicy', () => {
  const realTrustedTypes = (window as any).trustedTypes;

  afterEach(() => {
    (window as any).trustedTypes = realTrustedTypes;
  });

  const install = () => {
    let created: any = null;
    (window as any).trustedTypes = {
      defaultPolicy: null,
      createPolicy: (name: string, rules: any) => (created = { name, rules }),
    };
    installWorkerURLPolicy();
    return created;
  };

  it('registers as the default policy, because the call sites cannot name one', () => {
    expect(install().name).toBe('default');
  });

  // A policy that returned its argument unchanged would satisfy the browser
  // while checking nothing. This is the check that makes it worth having.
  it('refuses to mint a worker URL for another origin', () => {
    const { rules } = install();

    expect(() => rules.createScriptURL('https://evil.example.com/worker.js')).toThrow();
    expect(rules.createScriptURL(`${window.location.origin}/worker-ABC123.js`))
      .toBe(`${window.location.origin}/worker-ABC123.js`);
    expect(rules.createScriptURL('./worker-ABC123.js')).toBe('./worker-ABC123.js');
  });

  // It only ever grants script URLs. An HTML sink finds no createHTML here and
  // is still refused, which is the point of the directive.
  it('grants nothing but script URLs', () => {
    expect(Object.keys(install().rules)).toEqual(['createScriptURL']);
  });

  it('does nothing where the browser has no Trusted Types', () => {
    (window as any).trustedTypes = undefined;
    expect(() => installWorkerURLPolicy()).not.toThrow();
  });
});

describe('withLegacyWorkerFactory', () => {
  const realEnvironment = (self as any).MonacoEnvironment;

  afterEach(() => {
    (self as any).MonacoEnvironment = realEnvironment;
  });

  const setup = () => {
    const posted: unknown[] = [];
    const worker = { postMessage: (m: unknown) => posted.push(m) };
    const getWorker = vi.fn(() => worker);
    (self as any).MonacoEnvironment = { getWorker };
    const createWebWorker = vi.fn((opts: unknown) => ({ opts }));
    const onDidCreateModel = () => undefined;
    const monaco = { editor: { createWebWorker, onDidCreateModel }, languages: {} };
    return { monaco, wrapped: withLegacyWorkerFactory(monaco), createWebWorker, getWorker, worker, posted };
  };

  // monaco-yaml's worker manager still passes { label, moduleId, createData };
  // monaco 0.55+ takes a started worker instead.
  it('starts the labelled worker and hands monaco the worker itself', async () => {
    const { wrapped, createWebWorker, getWorker, worker, posted } = setup();
    const host = {};

    wrapped.editor.createWebWorker({ label: 'yaml', moduleId: 'vs/yaml', createData: { a: 1 }, host, keepIdleModels: true });

    expect(getWorker).toHaveBeenCalledWith('workerMain.js', 'yaml');
    const passed = createWebWorker.mock.calls[0][0] as any;
    expect(passed.host).toBe(host);
    expect(passed.keepIdleModels).toBe(true);
    await expect(passed.worker).resolves.toBe(worker);
    // The worker's initialize() arms on the first message and reads
    // createData from the second, as monaco's own language services send.
    expect(posted).toEqual(['ignore', { a: 1 }]);
  });

  it('passes a call that already carries a worker straight through', () => {
    const { wrapped, createWebWorker, getWorker } = setup();
    const opts = { worker: {} };

    wrapped.editor.createWebWorker(opts);

    expect(createWebWorker).toHaveBeenCalledWith(opts);
    expect(getWorker).not.toHaveBeenCalled();
  });

  it('leaves the monaco module itself unchanged', () => {
    const { monaco, wrapped, createWebWorker } = setup();

    expect(monaco.editor.createWebWorker).toBe(createWebWorker);
    expect(wrapped.editor.onDidCreateModel).toBe(monaco.editor.onDidCreateModel);
    expect(wrapped.languages).toBe(monaco.languages);
  });
});
