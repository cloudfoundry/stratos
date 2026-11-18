import { HttpErrorResponse } from '@angular/common/http';
import { isProxyErrorEntry, proxyErrorReason } from './services/proxy-error-entry';
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
// The message of extractHttpErrorMessage followed by the HTTP status, unless
// the message is already the status. '' when there is nothing to read, so
// callers can fall back with `||`.
export function httpErrorResponseToSafeString(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const message = extractHttpErrorMessage(err);
    return message.startsWith(`HTTP ${err.status}`) ? message : `${message} (${err.status})`;
  }
  return typeof err === 'string' ? err : (err as { message?: string } | null | undefined)?.message ?? '';
}

// An upstream error detail can quote a whole HTML error page (CF embeds a
// broker's raw response body). This keeps the page's heading and message,
// one block per line, and drops its title, styles, scripts and footer
// markup; text that is not a page only loses its tags, as it always has.
// Messages are always shown as text, so this is for legibility, not safety.
export const stripMarkup = (text: string): string => piecesToText(htmlToPieces(text));

const textPiece = (text: string): ErrorPiece[] => [{ text, style: 'text' }];

// A plain-text detail that quotes a few HTML tags (`<b>name</b>`): only those
// tags go, so text in angle brackets that is not HTML (Go's `<nil>`) stays.
const detailPieces = (detail: string): ErrorPiece[] => {
  const tags = /<\/?(?:a|abbr|b|big|br|code|em|font|i|kbd|p|s|small|span|strong|sub|sup|tt|u)(?:\s[^<>]*)?\/?>/gi;
  const text = detail.replace(tags, ' ').replace(/\s+/g, ' ').trim();
  return text ? textPiece(text) : [];
};

// A message that may quote an HTML page after a lead-in, such as capi's
// `resource not found (status 404): <html>...`: the page is read, the
// lead-in kept, and the text itself is used when the page has no words.
const messagePieces = (text: string): ErrorPiece[] => {
  if (!looksLikeHtml(text)) return textPiece(text);
  const pieces = htmlToPieces(text);
  return pieces.length ? pieces : textPiece(text);
};

/**
 * The most useful human-readable message in whatever a request threw, for
 * display after a caller's own lead-in, as styled pieces of plain text: an
 * HTML error page keeps its heading and line breaks. Handles four backend
 * body shapes:
 *   - CF passthrough: { errors: [{ detail, title, code }] }
 *   - Stratos job envelope: { state, errors: [{ message, code, detail }] }
 *   - handleCapiError fallback: { error: "..." }
 *   - Jetstream's own wrapped error: { error: { message, status, statusCode },
 *     errorResponse }; with no message it is the proxy's entry for an
 *     endpoint that failed, read as its status line and the endpoint's words
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
        const detail = typeof first.detail !== 'string' ? []
          : looksLikeHtml(first.detail) ? htmlToPieces(first.detail) : detailPieces(first.detail);
        if (detail.length) return detail;
        if (first.title) return textPiece(first.title);
        if (first.message) return textPiece(first.message);
      }
      const top = body as { message?: string; error?: unknown };
      if (top.message) return messagePieces(top.message);
      if (typeof top.error === 'string' && top.error) return messagePieces(top.error);
      const wrapped = top.error as { message?: unknown } | null | undefined;
      if (typeof wrapped?.message === 'string' && wrapped.message) return messagePieces(wrapped.message);
      if (isProxyErrorEntry(body)) return messagePieces(proxyErrorReason(body));
    }
    if (typeof body === 'string' && body) {
      if (!looksLikeHtml(body)) return textPiece(body);
      const page = htmlToPieces(body);
      if (page.length) return page;
    }
    if (err.status === 0) return textPiece('Could not reach the server.');
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

/** One failed sub-call of a request that answered 200: its detail or title. */
export interface PartialFailure {
  detail?: string;
  title?: string;
}

/**
 * The Error to throw when a request answered 200 but listed failures in its
 * body (patchApp's `_meta.errors`): each failure's words as pieces, an HTML
 * page read, joined by '; '. Its message is their text, `pieces` keeps them.
 */
export function partialFailureError(failures: PartialFailure[]): Error & { pieces: ErrorPiece[] } {
  const pieces: ErrorPiece[] = [];
  failures.forEach((failure, i) => {
    for (const piece of [...(i ? textPiece('; ') : []), ...messagePieces(failure.detail || failure.title || '')]) {
      const last = pieces[pieces.length - 1];
      if (last?.style === piece.style) {
        pieces[pieces.length - 1] = { text: last.text + piece.text, style: piece.style };
      } else {
        pieces.push(piece);
      }
    }
  });
  return Object.assign(new Error(piecesToText(pieces)), { pieces });
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
