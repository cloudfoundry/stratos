import { HttpErrorResponse } from '@angular/common/http';

import { isHttpErrorResponse, JetStreamErrorResponse } from '../../store/src/jetstream';


export function jetStreamErrorResponseToSafeString(response: JetStreamErrorResponse): string {
  return response.error && response.error.status && response.error.statusCode ?
    `${response.error.status}. Status Code ${response.error.statusCode}` :
    null;
}

/**
 * Attempt to create a sensible string explaining the error object returned from a failed http request
 * @param err The raw error from a http request
 */
export function httpErrorResponseToSafeString(err: any): string {
  const httpResponse: HttpErrorResponse = isHttpErrorResponse(err);
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
