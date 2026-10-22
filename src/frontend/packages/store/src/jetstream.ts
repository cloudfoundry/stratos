import { HttpErrorResponse } from '@angular/common/http';
import { ErrorPiece, htmlToPieces, looksLikeHtml, piecesToText } from './upstream-error-text';

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
// broker's raw response body). This keeps the page's heading and message,
// one block per line, and drops its title, styles, scripts and footer
// markup; text that is not a page only loses its tags, as it always has.
// Messages are always shown as text, so this is for legibility, not safety.
export const stripMarkup = (text: string): string => piecesToText(htmlToPieces(text));

const textPiece = (text: string): ErrorPiece[] => [{ text, style: 'text' }];

/**
 * The most useful human-readable message in whatever a request threw, for
 * display after a caller's own lead-in, as styled pieces of plain text: an
 * HTML error page keeps its heading and line breaks. Handles three backend
 * body shapes:
 *   - CF passthrough: { errors: [{ detail, title, code }] }
 *   - Stratos job envelope: { state, errors: [{ message, code, detail }] }
 *   - handleCapiError fallback: { error: "..." }
 * and a body that is a string: an HTML page from a proxy in front of
 * Stratos is read as one, any other text is kept as it is. An Error that
 * carries `pieces` (StratosJobError) gives those.
 */
export function extractHttpErrorPieces(err: unknown): ErrorPiece[] {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object') {
      const errors = (body as { errors?: Array<{ detail?: unknown; title?: string; message?: string }> }).errors;
      const first = errors?.[0];
      if (first) {
        const detail = typeof first.detail === 'string' ? htmlToPieces(first.detail) : [];
        if (detail.length) return detail;
        if (first.title) return textPiece(first.title);
        if (first.message) return textPiece(first.message);
      }
      const top = body as { message?: string; error?: string };
      if (top.message) return textPiece(top.message);
      if (top.error) return textPiece(top.error);
    }
    if (typeof body === 'string' && body) {
      if (!looksLikeHtml(body)) return textPiece(body);
      const page = htmlToPieces(body);
      if (page.length) return page;
    }
    return textPiece(err.statusText && err.statusText !== 'OK'
      ? `HTTP ${err.status} ${err.statusText}`
      : `HTTP ${err.status}`);
  }
  if (err instanceof Error) {
    const pieces = (err as { pieces?: unknown }).pieces;
    return Array.isArray(pieces) && pieces.length ? pieces as ErrorPiece[] : textPiece(err.message);
  }
  if (typeof err === 'string' && err) return textPiece(err);
  return textPiece('unknown error');
}

/**
 * The text of extractHttpErrorPieces: the message for a caller's own
 * lead-in. An HttpErrorResponse is not an Error, so `err.message`/
 * `String(err)` give Angular's "Http failure response for ..." or
 * "[object Object]" instead. An HTML page's lines are joined with '\n'.
 */
export function extractHttpErrorMessage(err: unknown): string {
  return piecesToText(extractHttpErrorPieces(err));
}

/** `${lead}: ${message}` as pieces, for a snackbar that shows them. */
export function leadPieces(lead: string, err: unknown): ErrorPiece[] {
  const [first, ...rest] = extractHttpErrorPieces(err);
  return first.style === 'text'
    ? [{ text: `${lead}: ${first.text}`, style: 'text' }, ...rest]
    : [{ text: `${lead}: `, style: 'text' }, first, ...rest];
}

/**
 * leadPieces as an Error, for a step's submit() to throw: its message is
 * their text, `pieces` keeps them for the stepper, `cause` is `err`.
 */
export function leadError(lead: string, err: unknown): Error & { pieces: ErrorPiece[] } {
  const pieces = leadPieces(lead, err);
  return Object.assign(new Error(piecesToText(pieces), { cause: err }), { pieces });
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
