import { HttpRequest } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';

import { StratosCatalogueEndpointEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { MakeEntityRequestPipe } from '../entity-request-pipeline.types';

export const makeRequestEntityPipe: MakeEntityRequestPipe = (
  httpClient,
  requestOrObservable,
  endpointConfig: StratosCatalogueEndpointEntity,
  endpointGuids: string | string[],
  externalRequest: boolean = false
) => {
  if (requestOrObservable instanceof HttpRequest) {
    return httpClient.pipelineRequest(
      requestOrObservable,
      endpointConfig,
      endpointGuids,
      externalRequest
    );
  }
  return requestOrObservable.pipe(
    switchMap(request => httpClient.pipelineRequest(
      request,
      endpointConfig,
      endpointGuids,
      externalRequest
    ))
  );
};
