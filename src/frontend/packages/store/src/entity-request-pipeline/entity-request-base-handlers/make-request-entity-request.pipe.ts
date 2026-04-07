import { HttpRequest } from '@angular/common/http';
import { throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { StratosCatalogEndpointEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { MakeEntityRequestPipe } from '../entity-request-pipeline.types';

export const makeRequestEntityPipe: MakeEntityRequestPipe = (
  httpClient,
  requestOrObservable,
  endpointConfig: StratosCatalogEndpointEntity,
  endpointGuids: string | string[],
  externalRequest: boolean = false
) => {
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
    return httpClient.pipelineRequest(
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
      return httpClient.pipelineRequest(
        request,
        endpointConfig,
        endpointGuids,
        externalRequest
      );
    })
  );
};
