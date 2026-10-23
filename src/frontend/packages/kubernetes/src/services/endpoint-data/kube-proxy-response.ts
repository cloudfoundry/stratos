import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';

import { ProxyErrorEntry, isProxyErrorEntry, proxyErrorReason } from '@stratosui/store';

// Reader for the Jetstream proxy (/pp/v1/proxy/..., targeted with the
// x-cap-cnsi-list header). Outside passthrough mode the proxy answers
// HTTP 200 with one entry per endpoint, and a failed call is that
// endpoint's error entry (see ProxyErrorEntry), not the resource.

export type KubeProxyResponse<T> = Record<string, T | ProxyErrorEntry | null>;

// A per-endpoint proxy failure. `status` matches HttpErrorResponse so
// callers that classify by status (401/403) treat both alike.
export class KubeProxyError extends Error {
  override readonly name = 'KubeProxyError';

  constructor(readonly status: number, message: string) {
    super(message);
  }
}

// Picks the endpoint's entry out of a proxy response, throwing a
// KubeProxyError (status and proxyErrorReason) when that entry is an
// error. A missing entry reads as undefined, as before.
export function kubeProxyResult<T>(kubeGuid: string): OperatorFunction<KubeProxyResponse<T> | null | undefined, T | undefined> {
  return map(resp => {
    const entry = resp?.[kubeGuid];
    if (isProxyErrorEntry(entry)) {
      throw new KubeProxyError(entry.error.statusCode, proxyErrorReason(entry));
    }
    return entry ?? undefined;
  });
}
