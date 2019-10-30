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
// TODO Remove -  angular 8
// function getHttpParams(options: RequestOptions) {
//   if (!options.params) {
//     return null;
//   }
//   return Array.from(options.params.paramsMap.entries()).reduce((obj, [key, value]) => {
//     obj[key] = value;
//     return obj;
//   }, {} as { [param: string]: string });
// }

// This will convert the old style RequestOptions into a new HttpRequest
// TODO Remove -  angular 8
// function getRequestFromLegacyOptions(
//   options: RequestOptions,
//   requestType: ApiRequestTypes
// ) {
//   const method = getRequestTypeFromRequestType(requestType);
//   return new HttpRequest(
//     method,
//     options.url,
//     options.body,
//     {
//       headers: new HttpHeaders(options.headers ? options.headers.toJSON() : null),
//       params: new HttpParams({
//         fromObject: getHttpParams(options)
//       })
//     },
//   );
// }


export const buildRequestEntityPipe = (
  requestType: ApiRequestTypes,
  requestOptions: HttpRequest<any>
): HttpRequest<any> => {
  // TODO Angular 8 this is no longer needed.
  return requestOptions;
};




