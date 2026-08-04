import { afterEach, describe, expect, it, vi } from 'vitest';

import { configureJsonDiagnostics, installWorkerURLPolicy } from './monaco-loader';

// Resolves to the window.monaco mock installed by test-setup. The mock
// carries no language services, so languages.json is absent by default —
// tests that assert forwarding install it and remove it again afterwards.
declare const monaco: typeof import('monaco-editor');

describe('configureJsonDiagnostics', () => {
  afterEach(() => {
    delete (monaco as any).languages;
  });

  it('forwards the options to jsonDefaults.setDiagnosticsOptions', async () => {
    const setDiagnosticsOptions = vi.fn();
    (monaco as any).languages = { json: { jsonDefaults: { setDiagnosticsOptions } } };

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
