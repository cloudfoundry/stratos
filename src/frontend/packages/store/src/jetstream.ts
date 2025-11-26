import type { HttpErrorResponse } from '@angular/common/http';

// API Version to use when making back-end API requests to Jetstraam
export const proxyAPIVersion = 'v1';

// CF API Version
export const cfAPIVersion = 'v2';

/**
 * Actual error response from stratos
 */
export interface JetStreamErrorResponse<T = unknown> {
  error: {
    status: string;
    statusCode: number;
  };
  /**
   * Actual response from proxied endpoint
   */
  errorResponse: T;
}

export function isHttpErrorResponse(obj: unknown): HttpErrorResponse {
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

export function jetStreamErrorResponseToSafeString(response: JetStreamErrorResponse): string {
  return response.error?.status && response.error.statusCode ?
    `${response.error.status}. Status Code ${response.error.statusCode}` :
    null;
}

/**
 * Attempt to create a sensible string explaining the error object returned from a failed http request
 * @param err The raw error from a http request
 */
export function httpErrorResponseToSafeString(err: unknown): string {
  const httpResponse: HttpErrorResponse = isHttpErrorResponse(err);
  if (httpResponse) {
    if (httpResponse.error) {
      if (typeof (httpResponse.error) === 'string') {
        return `${httpResponse.error} (${httpResponse.status})`;
      }
      return `${(httpResponse.error as { error?: unknown }).error} (${httpResponse.status})`;
    }
    return `${JSON.stringify(httpResponse.error)} (${httpResponse.status})`;
  }
  return (err as { message?: string }).message || String(err);
}

// TODO It would be nice if the BE could return a unique para for us to check for. #3827
// There is always a chance that this will return a false positive (more so with extensions).
export function hasJetStreamError(pages: Partial<JetStreamErrorResponse>[]): JetStreamErrorResponse {
  if (!pages || !pages.length) {
    return null;
  }
  return pages.find(page => {
    return isJetstreamError(page);
  }) as JetStreamErrorResponse;
}

export function isJetstreamError(err: unknown): JetStreamErrorResponse {
  const typedErr = err as { error?: { status?: unknown; statusCode?: unknown }; errorResponse?: unknown };
  return (
    typedErr?.error?.status &&
    typedErr.error.statusCode &&
    'errorResponse' in typedErr
  ) ? err as JetStreamErrorResponse : null;
}
