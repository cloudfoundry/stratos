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
        // 502 from a native CF handler typically signals stale token / failed
        // refresh on the proxy side. Mark the endpoint stale + show a one-shot
        // toast linking to the endpoints page so the user can reconnect. Look
        // up the endpoint name so the toast tells the user *which* endpoint to
        // reconnect (the GUID is included as a tail-end disambiguator for the
        // case where two endpoints share a display name).
        if (cnsiGuid && err instanceof HttpErrorResponse && err.status === 502) {
          if (authState.markStale(cnsiGuid)) {
            const endpoint = endpointsSignal.endpoints()[cnsiGuid];
            const label = endpoint?.name
              ? `'${endpoint.name}' (${cnsiGuid})`
              : cnsiGuid;
            const ref = snackbar.error(
              `Cloud Foundry endpoint ${label} authentication expired. Reconnect to refresh.`,
              'Reconnect',
            );
            ref.onAction().subscribe(() => router.navigate(['/endpoints']));
          }
        }
      },
    }),
  );
};
