import { HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { StratosDiagnostics } from '../services/diagnostics/stratos-diagnostics.service';

const GUID_RE = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

// Collapse GUIDs to `:guid` so aggregated counts/timings group the same API
// call across different endpoints. Without this, every cnsi/org/app/etc. GUID
// becomes its own urlPattern dimension and the counters fragment into noise.
function extractUrlPattern(url: string): string {
  return url.replace(GUID_RE, '/:guid');
}

export const cfApiInterceptor: HttpInterceptorFn = (req, next) => {
  const diagnostics = inject(StratosDiagnostics);
  const start = performance.now();
  const urlPattern = extractUrlPattern(req.url);
  const method = req.method;
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
      },
      error: () => {
        const ms = performance.now() - start;
        diagnostics.emitCounter('api-call-count', { urlPattern, method, outcome: 'error' });
        diagnostics.emitSample('api-call-timing', { urlPattern, method, outcome: 'error' }, ms);
      },
    }),
  );
};
