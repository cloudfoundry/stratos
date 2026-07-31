import { afterEach, describe, expect, it, vi } from 'vitest';

import { configureJsonDiagnostics } from './monaco-loader';

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
