import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { KubeProxyError, KubeProxyResponse, kubeProxyErrorReason, kubeProxyResult } from './kube-proxy-response';

const read = <T>(resp: KubeProxyResponse<T> | null, guid = 'kube-a') =>
  firstValueFrom(of(resp).pipe(kubeProxyResult<T>(guid)));

describe('kubeProxyResult', () => {
  it('returns the endpoint\'s entry', async () => {
    await expect(read({ 'kube-a': { items: [1] }, 'kube-b': { items: [2] } })).resolves.toEqual({ items: [1] });
  });

  it('reads a missing entry or response as undefined', async () => {
    await expect(read({ 'kube-a': null })).resolves.toBeUndefined();
    await expect(read({})).resolves.toBeUndefined();
    await expect(read(null)).resolves.toBeUndefined();
  });

  it('throws the endpoint\'s error entry with its status and reason', async () => {
    const err = await read({
      'kube-a': { error: { statusCode: 403, status: '403 Forbidden' }, errorResponse: { message: 'pods is forbidden' } },
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(KubeProxyError);
    expect((err as KubeProxyError).status).toBe(403);
    expect((err as KubeProxyError).message).toBe('403 Forbidden: pods is forbidden');
  });

  it('ignores another endpoint\'s error entry', async () => {
    await expect(read({
      'kube-a': { items: [] },
      'kube-b': { error: { statusCode: 500, status: 'Error proxing request' } },
    })).resolves.toEqual({ items: [] });
  });
});

describe('kubeProxyErrorReason', () => {
  it('appends the transport error text', () => {
    expect(kubeProxyErrorReason({
      error: { statusCode: 500, status: 'Error proxing request' },
      errorResponse: 'dial tcp 10.0.0.1:6443: i/o timeout',
    })).toBe('Error proxing request: dial tcp 10.0.0.1:6443: i/o timeout');
  });

  it('drops a detail the status line already says', () => {
    expect(kubeProxyErrorReason({
      error: { statusCode: 401, status: '401 Unauthorized' },
      errorResponse: { kind: 'Status', message: 'Unauthorized' },
    })).toBe('401 Unauthorized');
  });

  it('uses the status line alone for an empty or non-text body', () => {
    expect(kubeProxyErrorReason({
      error: { statusCode: 400, status: 'Unable to retrieve CNSI token record' },
      errorResponse: '',
    })).toBe('Unable to retrieve CNSI token record');
    expect(kubeProxyErrorReason({ error: { statusCode: 502, status: '502 Bad Gateway' }, errorResponse: null }))
      .toBe('502 Bad Gateway');
  });

  it('falls back to the status code when there is no status line', () => {
    expect(kubeProxyErrorReason({ error: { statusCode: 504 } })).toBe('HTTP 504');
  });
});
