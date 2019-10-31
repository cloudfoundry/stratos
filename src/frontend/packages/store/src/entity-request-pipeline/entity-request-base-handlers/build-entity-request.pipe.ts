import { HttpRequest } from '@angular/common/http';

import { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';


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

export const buildRequestEntityPipe = (
  requestType: ApiRequestTypes,
  requestOptions: HttpRequest<any>
): HttpRequest<any> => {
  // TODO Angular 8 this is no longer needed.
  return requestOptions;
};




