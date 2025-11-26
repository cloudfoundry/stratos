import { HttpRequest } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import type { StratosCatalogEndpointEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import type { JetstreamResponse } from '../entity-request-pipeline.types';
import type { PipelineHttpClient } from '../pipline-http-client.service';

export const makeRequestEntityPipe = <T = unknown>(
  httpClient: PipelineHttpClient,
  requestOrObservable: HttpRequest<unknown> | Observable<HttpRequest<unknown>>,
  endpointConfig: StratosCatalogEndpointEntity,
  endpointGuids: string | string[],
  externalRequest: boolean = false
): Observable<JetstreamResponse<T>> => {
  // Defensive null checks for Angular 20 DI compatibility
  if (!httpClient) {
    console.error('makeRequestEntityPipe: httpClient is null or undefined');
    return throwError(() => new Error('httpClient is null in makeRequestEntityPipe'));
  }
  if (!endpointConfig) {
    console.error('makeRequestEntityPipe: endpointConfig is null or undefined');
    return throwError(() => new Error('endpointConfig is null in makeRequestEntityPipe'));
  }

  if (requestOrObservable instanceof HttpRequest) {
    return httpClient.pipelineRequest<JetstreamResponse<T>>(
      requestOrObservable,
      endpointConfig,
      endpointGuids,
      externalRequest
    );
  }

  if (!requestOrObservable) {
    console.error('makeRequestEntityPipe: requestOrObservable is null or undefined');
    return throwError(() => new Error('requestOrObservable is null in makeRequestEntityPipe'));
  }

  return requestOrObservable.pipe(
    switchMap(request => {
      if (!request) {
        console.error('makeRequestEntityPipe: request from observable is null');
        return throwError(() => new Error('request from observable is null'));
      }
      return httpClient.pipelineRequest<JetstreamResponse<T>>(
        request,
        endpointConfig,
        endpointGuids,
        externalRequest
      );
    })
  );
};
