import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { KubeProxyError, KubeProxyResponse, kubeProxyResult } from './kube-proxy-response';

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
      'kube-b': { error: { statusCode: 500, status: 'Error proxying request' } },
    })).resolves.toEqual({ items: [] });
  });
});
