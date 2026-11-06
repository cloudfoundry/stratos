import { HttpErrorResponse } from '@angular/common/http';

import { StratosJobError } from './async-jobs/async-job.types';

// Pulls the most useful human-readable message out of whatever the backend
// or framework threw. Handles three backend response shapes:
//   - CF passthrough: { errors: [{ detail, title, code }] }
//   - Stratos job envelope: { state, errors: [{ message, code, detail }] }
//   - handleCapiError fallback: { error: "..." }
// Without this, callers fall back to Angular's HttpErrorResponse.message
// ("Http failure response for ... 502 OK") which tells the operator nothing.
export function extractHttpErrorMessage(err: unknown): string {
  if (err instanceof StratosJobError) return err.message;
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object') {
      const errors = (body as { errors?: Array<{ detail?: unknown; title?: string; message?: string }> }).errors;
      const first = errors?.[0];
      if (first) {
        if (typeof first.detail === 'string' && first.detail) return first.detail;
        if (first.title) return first.title;
        if (first.message) return first.message;
      }
      const top = body as { message?: string; error?: string };
      if (top.message) return top.message;
      if (top.error) return top.error;
    }
    if (typeof body === 'string' && body) return body;
    return err.statusText && err.statusText !== 'OK'
      ? `HTTP ${err.status} ${err.statusText}`
      : `HTTP ${err.status}`;
  }
  if (err instanceof Error) return err.message;
  return 'unknown error';
}
