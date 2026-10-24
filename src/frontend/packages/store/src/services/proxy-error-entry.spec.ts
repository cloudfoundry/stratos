import { describe, expect, it } from 'vitest';

import { isProxyErrorEntry, proxyErrorReason } from './proxy-error-entry';

describe('isProxyErrorEntry', () => {
  it('recognises the proxy\'s per-endpoint error entry only', () => {
    expect(isProxyErrorEntry({ error: { statusCode: 500, status: 'Error proxying request' } })).toBe(true);
    expect(isProxyErrorEntry({ items: [] })).toBe(false);
    expect(isProxyErrorEntry({ error: 'text' })).toBe(false);
    expect(isProxyErrorEntry(null)).toBe(false);
    expect(isProxyErrorEntry(undefined)).toBe(false);
  });
});

describe('proxyErrorReason', () => {
  it('appends the transport error text', () => {
    expect(proxyErrorReason({
      error: { statusCode: 500, status: 'Error proxying request' },
      errorResponse: 'dial tcp 10.0.0.1:6443: i/o timeout',
    })).toBe('Error proxying request: dial tcp 10.0.0.1:6443: i/o timeout');
  });

  it('drops a detail the status line already says', () => {
    expect(proxyErrorReason({
      error: { statusCode: 401, status: '401 Unauthorized' },
      errorResponse: { kind: 'Status', message: 'Unauthorized' },
    })).toBe('401 Unauthorized');
  });

  it('uses the status line alone for an empty or non-text body', () => {
    expect(proxyErrorReason({
      error: { statusCode: 400, status: 'Unable to retrieve CNSI token record' },
      errorResponse: '',
    })).toBe('Unable to retrieve CNSI token record');
    expect(proxyErrorReason({ error: { statusCode: 502, status: '502 Bad Gateway' }, errorResponse: null }))
      .toBe('502 Bad Gateway');
  });

  it('falls back to the status code when there is no status line', () => {
    expect(proxyErrorReason({ error: { statusCode: 504 } })).toBe('HTTP 504');
  });
});
