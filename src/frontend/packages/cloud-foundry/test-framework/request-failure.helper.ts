import { HttpErrorResponse } from '@angular/common/http';

import { ErrorPiece, piecesToText } from '@stratosui/store';

/** The reason Cloud Foundry gives in `cfRequestFailure()`. */
export const CF_FAILURE_DETAIL = 'The route is shared with another space.';

/**
 * What a failed request rejects with: the `HttpErrorResponse` itself, carrying
 * Cloud Foundry's own error body. It is not an `Error`, and its `message` is
 * Angular's "Http failure response for <url>: <status>", not the reason.
 */
export const cfRequestFailure = (): HttpErrorResponse => new HttpErrorResponse({
  status: 422,
  statusText: 'Unprocessable Entity',
  url: 'https://console.example.com/pp/v1/cf/routes/cf1/r1/apps/a1',
  error: { errors: [{ code: 10008, title: 'CF-UnprocessableEntity', detail: CF_FAILURE_DETAIL }] },
});

/** A snackbar message as text, whether the snackbar was given text or pieces. */
export const snackText = (message: string | readonly ErrorPiece[]): string =>
  typeof message === 'string' ? message : piecesToText(message);
