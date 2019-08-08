import { MakeEntityRequestPipe } from '../entity-request-pipeline.types';
import { HttpRequest } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';

export const makeRequestEntityPipe: MakeEntityRequestPipe = (
  httpClient,
  requestOrObservable,
  endpointType,
  endpointGuids,
  externalRequest: boolean = false
) => {
  if (requestOrObservable instanceof HttpRequest) {
    return httpClient.pipelineRequest(
      requestOrObservable,
      endpointType,
      endpointGuids,
      externalRequest
    );
  }
  return requestOrObservable.pipe(
    switchMap(request => httpClient.pipelineRequest(
      request,
      endpointType,
      endpointGuids,
      externalRequest
    ))
  );
};
