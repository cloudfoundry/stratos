// The Jetstream proxy's per-endpoint error entry. Outside passthrough
// mode the proxy (/pp/v1/proxy/..., and the metrics plugin's
// /pp/v1/metrics/...) answers HTTP 200 with one entry per endpoint named
// in x-cap-cnsi-list (jetstream passthrough.go, buildJSONResponse). A call
// the endpoint failed or never answered is an error entry, not the
// resource:
//   { error: { statusCode, status }, errorResponse }
// statusCode/status are the upstream code and status line, 500 "Error
// proxing request" when the request itself failed (e.g. the endpoint is
// unreachable), or 400 "Unable to retrieve CNSI token record" with no
// stored token. errorResponse is the upstream body (e.g. a Kubernetes
// Status object) or a JSON string (e.g. the transport error text).

export interface ProxyErrorEntry {
  error: { statusCode: number; status?: string };
  errorResponse?: unknown;
}

export function isProxyErrorEntry(entry: unknown): entry is ProxyErrorEntry {
  const error = (entry as ProxyErrorEntry | null)?.error;
  return !!error && typeof error === 'object' && typeof error.statusCode === 'number';
}

// Status line plus the endpoint's own words: the body's message (a
// Kubernetes Status, for example) or the transport error text. The
// detail is dropped when the status line already says it
// ("401 Unauthorized" / "Unauthorized").
export function proxyErrorReason(entry: ProxyErrorEntry): string {
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
