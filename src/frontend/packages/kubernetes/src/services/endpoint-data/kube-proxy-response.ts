import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';

// Reader for the Jetstream proxy (/pp/v1/proxy/..., targeted with the
// x-cap-cnsi-list header). Outside passthrough mode the proxy answers
// HTTP 200 with one entry per endpoint (jetstream passthrough.go,
// buildJSONResponse). A call the endpoint failed or never answered is
// an error entry, not the resource:
//   { error: { statusCode, status }, errorResponse }
// statusCode/status are the upstream code and status line, 500 "Error
// proxing request" when the request itself failed (e.g. the cluster is
// unreachable), or 400 "Unable to retrieve CNSI token record" with no
// stored token. errorResponse is the upstream body (a Kubernetes Status
// object) or a JSON string (e.g. the transport error text).

export interface KubeProxyErrorEntry {
  error: { statusCode: number; status?: string };
  errorResponse?: unknown;
}

export type KubeProxyResponse<T> = Record<string, T | KubeProxyErrorEntry | null>;

// A per-endpoint proxy failure. `status` matches HttpErrorResponse so
// callers that classify by status (401/403) treat both alike.
export class KubeProxyError extends Error {
  override readonly name = 'KubeProxyError';

  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export function isKubeProxyErrorEntry(entry: unknown): entry is KubeProxyErrorEntry {
  const error = (entry as KubeProxyErrorEntry | null)?.error;
  return !!error && typeof error === 'object' && typeof error.statusCode === 'number';
}

// Picks the endpoint's entry out of a proxy response, throwing a
// KubeProxyError when that entry is an error. A missing entry reads as
// undefined, as before.
export function kubeProxyResult<T>(kubeGuid: string): OperatorFunction<KubeProxyResponse<T> | null | undefined, T | undefined> {
  return map(resp => {
    const entry = resp?.[kubeGuid];
    if (isKubeProxyErrorEntry(entry)) {
      throw new KubeProxyError(entry.error.statusCode, kubeProxyErrorReason(entry));
    }
    return entry ?? undefined;
  });
}

// Status line plus the endpoint's own words: a Kubernetes Status
// message or the transport error text. The detail is dropped when the
// status line already says it (e.g. "401 Unauthorized" / "Unauthorized").
export function kubeProxyErrorReason(entry: KubeProxyErrorEntry): string {
  const status = (entry.error.status ?? '').trim() || `HTTP ${entry.error.statusCode}`;
  const body = entry.errorResponse;
  const raw = typeof body === 'string'
    ? body
    : (body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string')
      ? (body as { message: string }).message
      : '';
  const detail = raw.trim();
  return detail && !status.endsWith(detail) ? `${status}: ${detail}` : status;
}
