import type { HttpRequest } from '@angular/common/http';

import type { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';


export function getRequestTypeFromRequestType(requestType: ApiRequestTypes) {
  if (requestType === 'update') {
    return 'PUT';
  }

  if (requestType === 'delete') {
    return 'DELETE';
  }

  if (requestType === 'create') {
    return 'POST';
  }

  return 'GET';
}

// FIXME Since the angular 8 update, this is no longer needed.
export const buildRequestEntityPipe = (
  _requestType: ApiRequestTypes,
  requestOptions: HttpRequest<unknown>
): HttpRequest<unknown> => {
  return requestOptions;
};




