import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { RequestOptions } from '@angular/http';

import { environment } from '../../../../core/src/environments/environment';
import { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';

const { proxyAPIVersion, cfAPIVersion } = environment;

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

function getHttpParams(options: RequestOptions) {
  if (!options.params) {
    return null;
  }
  return Array.from(options.params.paramsMap.entries()).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});
}

// This will convert the old style RequestOptions into a new HttpRequest
function getRequestFromLegacyOptions(
  options: RequestOptions,
  requestType: ApiRequestTypes,
  url: string
) {
  const method = getRequestTypeFromRequestType(requestType);
  return new HttpRequest(
    method,
    url,
    options.body,
    {
      headers: new HttpHeaders(options.headers ? options.headers.toJSON() : null),
      params: new HttpParams({
        fromObject: getHttpParams(options)
      })
    },
  );
}


export const buildRequestEntityPipe = (
  requestType: ApiRequestTypes,
  requestOptions: RequestOptions | HttpRequest<any>
): HttpRequest<any> => {
  const url = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${requestOptions.url}`;
  if (requestOptions instanceof HttpRequest) {
    return requestOptions.clone({
      url
    });
  }
  return getRequestFromLegacyOptions({ ...requestOptions } as RequestOptions, requestType, url);
};




