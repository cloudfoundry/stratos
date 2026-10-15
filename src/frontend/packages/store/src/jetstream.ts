import { HttpErrorResponse } from '@angular/common/http';

// API Version to use when making back-end API requests to Jetstraam
export const proxyAPIVersion = 'v1';

/**
 * Actual error response from stratos
 */
export interface JetStreamErrorResponse<T = any> {
  error: {
    status: string;
    statusCode: number;
  };
  /**
   * Actual response from proxied endpoint
   */
  errorResponse: T;
}

export function isHttpErrorResponse(obj: any): HttpErrorResponse | null {
  const props = Object.keys(obj);
  return (
    props.indexOf('error') >= 0 &&
    props.indexOf('headers') >= 0 &&
    props.indexOf('ok') >= 0 &&
    props.indexOf('status') >= 0 &&
    props.indexOf('statusText') >= 0 &&
    props.indexOf('url') >= 0
  ) ? obj as HttpErrorResponse : null;
}

export function jetStreamErrorResponseToSafeString(response: JetStreamErrorResponse): string | null {
  return response.error && response.error.status && response.error.statusCode ?
    `${response.error.status}. Status Code ${response.error.statusCode}` :
    null;
}

/**
 * Attempt to create a sensible string explaining the error object returned from a failed http request
 * @param err The raw error from a http request
 */
export function httpErrorResponseToSafeString(err: any): string {
  const httpResponse: HttpErrorResponse | null = isHttpErrorResponse(err);
  if (httpResponse) {
    if (httpResponse.error) {
      if (typeof (httpResponse.error) === 'string') {
        return httpResponse.error + ` (${httpResponse.status})`;
      }
      return httpResponse.error.error + ` (${httpResponse.status})`;
    }
    return JSON.stringify(httpResponse.error) + ` (${httpResponse.status})`;
  }
  return err.message;
}

// An upstream error detail can quote a whole HTML error page (CF embeds a
// broker's raw response body); keep the words, drop the tags. Messages are
// always shown as text, so this is for legibility, not safety. A tag may
// not contain '<': with only '>' excluded, a run of '<' and no '>' (the
// body is the server's) backtracks quadratically.
export const stripMarkup = (text: string): string =>
  text.replace(/<[^<>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * The most useful human-readable message in whatever a request threw, for
 * display after a caller's own lead-in. Handles three backend body shapes:
 *   - CF passthrough: { errors: [{ detail, title, code }] }
 *   - Stratos job envelope: { state, errors: [{ message, code, detail }] }
 *   - handleCapiError fallback: { error: "..." }
 * An HttpErrorResponse is not an Error, so `err.message`/`String(err)` give
 * Angular's "Http failure response for ..." or "[object Object]" instead.
 */
export function extractHttpErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object') {
      const errors = (body as { errors?: Array<{ detail?: unknown; title?: string; message?: string }> }).errors;
      const first = errors?.[0];
      if (first) {
        const detail = typeof first.detail === 'string' ? stripMarkup(first.detail) : '';
        if (detail) return detail;
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
  if (typeof err === 'string' && err) return err;
  return 'unknown error';
}

// TODO It would be nice if the BE could return a unique para for us to check for. #3827
// There is always a chance that this will return a false positive (more so with extensions).
export function hasJetStreamError(pages: Partial<JetStreamErrorResponse>[]): JetStreamErrorResponse | null {
  if (!pages || !pages.length) {
    return null;
  }
  return (pages.find(page => {
    return isJetstreamError(page);
  }) as JetStreamErrorResponse) ?? null;
}

export function isJetstreamError(err: any): JetStreamErrorResponse | null {
  return err &&
    err.error &&
    err.error.status &&
    err.error.statusCode &&
    'errorResponse' in err ? err as JetStreamErrorResponse : null;
}
