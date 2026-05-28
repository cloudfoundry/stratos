import { HttpErrorResponse, HttpEventType, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { EndpointAuthStateService, EndpointsSignalService, TailwindSnackBarService } from '@stratosui/core';
import { StratosDiagnostics } from '../services/diagnostics/stratos-diagnostics.service';

// Stratos cnsi GUIDs come in two flavours: standard hex UUIDs from
// uuid.New() and URL-safe base64-encoded SHA hashes from the desktop
// plugin (see jetstream/plugins/desktop/endpoints.go). The base64 form
// is mixed-case alphanumeric plus `-`/`_`, so the hex-only `[0-9a-f-]`
// regex used previously dropped half of all real-world endpoints on
// the floor. Min length 20 disambiguates from action names like
// "spaces" / "apps" / "info" without false-matching them.
const CNSI_GUID_RE = /[A-Za-z0-9_-]{20,}/.source;
const GUID_RE = new RegExp(
  `\\/(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|${CNSI_GUID_RE})`,
  'g',
);

// Native CF handler URL shape: /pp/v1/cf/{action}/{cnsiGuid}[?query] OR
// /pp/v1/cf/{cnsiGuid}/... — capture the cnsiGuid in either position.
const NATIVE_CF_PATH_RE = new RegExp(`\\/pp\\/v1\\/cf\\/[a-z_][a-z0-9_]*\\/(${CNSI_GUID_RE})(?:[/?]|$)`);
const NATIVE_CF_PATH_PREFIX_RE = new RegExp(`\\/pp\\/v1\\/cf\\/(${CNSI_GUID_RE})(?:[/?]|$)`);

// Collapse GUIDs to `:guid` so aggregated counts/timings group the same API
// call across different endpoints. Without this, every cnsi/org/app/etc. GUID
// becomes its own urlPattern dimension and the counters fragment into noise.
function extractUrlPattern(url: string): string {
  return url.replace(GUID_RE, '/:guid');
}

function extractCnsiGuid(url: string): string | null {
  const m = url.match(NATIVE_CF_PATH_RE) ?? url.match(NATIVE_CF_PATH_PREFIX_RE);
  return m ? m[1] : null;
}

// Headers the Jetstream native-CF error paths set to classify a failure.
// REASON is only emitted for called-out reasons (unreachable / auth_expired);
// UPSTREAM_STATUS carries the real CF/UAA code (e.g. 503) since the Stratos
// response status is often a mapped 502.
const STRATOS_ERROR_REASON_HEADER = 'X-Stratos-Error-Reason';
const STRATOS_UPSTREAM_STATUS_HEADER = 'X-Stratos-Upstream-Status';

interface NativeCfErrorBody {
  reason?: string;
  upstreamStatus?: number;
  detail?: string;
  cnsiGuid?: string;
}

// Parse a native CF error body using the first-character discriminator the
// backend emits: '{' → JSON, '#' → plain string (marker stripped), anything
// else → legacy plain string. Angular may already have parsed a JSON body
// into an object, in which case it's returned as-is.
function parseNativeCfErrorBody(err: HttpErrorResponse): NativeCfErrorBody {
  const raw = err.error;
  if (raw && typeof raw === 'object') {
    return raw as NativeCfErrorBody;
  }
  if (typeof raw !== 'string') {
    return {};
  }
  const s = raw.trimStart();
  if (s.startsWith('{')) {
    try {
      return JSON.parse(s) as NativeCfErrorBody;
    } catch {
      return {};
    }
  }
  if (s.startsWith('#')) {
    return { detail: s.slice(1) };
  }
  return { detail: s };
}

export const cfApiInterceptor: HttpInterceptorFn = (req, next) => {
  const diagnostics = inject(StratosDiagnostics);
  const authState = inject(EndpointAuthStateService);
  const snackbar = inject(TailwindSnackBarService);
  const router = inject(Router);
  const endpointsSignal = inject(EndpointsSignalService);
  const start = performance.now();
  const urlPattern = extractUrlPattern(req.url);
  const method = req.method;
  const cnsiGuid = extractCnsiGuid(req.url);
  return next(req).pipe(
    tap({
      next: (event) => {
        // HttpClient's observable emits progress events (Sent, UploadProgress,
        // DownloadProgress) followed by a final Response. Only count the final
        // Response event once — otherwise the interceptor double-counts for any
        // transport that reports progress.
        if (event.type !== HttpEventType.Response) return;
        const ms = performance.now() - start;
        diagnostics.emitCounter('api-call-count', { urlPattern, method });
        diagnostics.emitSample('api-call-timing', { urlPattern, method }, ms);
        // Self-heal: any successful CAPI response from an endpoint clears
        // a previous stale mark for that endpoint. Avoids needing to thread
        // post-reconnect notifications back into this service.
        if (cnsiGuid && (event as HttpResponse<unknown>).status >= 200 && (event as HttpResponse<unknown>).status < 300) {
          authState.clearStale(cnsiGuid);
        }
      },
      error: (err) => {
        const ms = performance.now() - start;
        diagnostics.emitCounter('api-call-count', { urlPattern, method, outcome: 'error' });
        diagnostics.emitSample('api-call-timing', { urlPattern, method, outcome: 'error' }, ms);
        // 502 from a native CF handler. The Jetstream middleware classifies
        // the failure via the X-Stratos-Error-Reason header so the banner can
        // tell the user the right thing: a rejected token (reconnect fixes
        // it), an unreachable/down endpoint (reconnect won't help), or an
        // unclassified request failure. The endpoint is always named (the
        // GUID is a tail-end disambiguator for shared display names).
        if (cnsiGuid && err instanceof HttpErrorResponse) {
          const reason = err.headers?.get(STRATOS_ERROR_REASON_HEADER) ?? '';
          // Act on classified failures (any status) or gateway 502s. Normal CF
          // errors (404/422/...) carry no reason and aren't 502 — leave those
          // to the component that made the call.
          if (reason || err.status === 502) {
            const endpoint = endpointsSignal.endpoints()[cnsiGuid];
            // Prefer the endpoint name; fall back to the GUID only when the
            // name is unknown. The GUID is otherwise omitted — the error code
            // is the useful diagnostic, not the opaque cnsi GUID.
            const label = endpoint?.name ? `'${endpoint.name}'` : cnsiGuid;
            const headerStatus = err.headers?.get(STRATOS_UPSTREAM_STATUS_HEADER);
            const body = parseNativeCfErrorBody(err);
            const upstreamStatus = headerStatus ? Number(headerStatus) : (body.upstreamStatus ?? 0);
            // Two-line banner: endpoint name on line 1, "HTTP <code>: <what>"
            // on line 2 (the "\n" renders via the snackbar's whitespace-pre-line
            // — see TailwindSnackBarService; we avoid <br>/innerHTML so the
            // user-controlled endpoint name can't inject markup).
            const codePrefix = upstreamStatus ? `HTTP ${upstreamStatus}: ` : '';
            const line1 = `Cloud Foundry endpoint ${label}`;

            if (reason === 'auth_expired') {
              // Stored token rejected — reconnecting re-authenticates.
              if (authState.markStale(cnsiGuid)) {
                const ref = snackbar.error(
                  `${line1}\n${codePrefix}Authentication expired. Reconnect to refresh.`,
                  'Reconnect',
                );
                ref.onAction().subscribe(() => router.navigate(['/endpoints']));
              }
            } else if (reason === 'unreachable') {
              // Endpoint is down — no stale mark (reconnect won't help).
              if (authState.notifyOnce(cnsiGuid, reason)) {
                snackbar.error(
                  `${line1}\n${codePrefix}The endpoint is unreachable or down.`,
                );
              }
            } else {
              // Unclassified failure — neutral, complete title naming the
              // endpoint; the calling component may surface its own detail.
              if (authState.notifyOnce(cnsiGuid, reason || 'generic')) {
                snackbar.error(
                  `${line1}\n${codePrefix}Request failed.`,
                );
              }
            }
          }
        }
      },
    }),
  );
};
