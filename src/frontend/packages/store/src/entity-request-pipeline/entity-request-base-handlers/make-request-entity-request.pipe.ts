import { MakeEntityRequestPipe } from '../entity-request-pipeline.types';
import { HttpRequest } from '@angular/common/http';
import { switchMap, tap } from 'rxjs/operators';

export const makeRequestEntityPipe: MakeEntityRequestPipe = (
  httpClient,
  requestOrObservable,
  endpointType,
  endpointGuids
) => {
  if (requestOrObservable instanceof HttpRequest) {
    return httpClient.pipelineRequest(
      requestOrObservable,
      endpointType,
      endpointGuids
    );
  }
  return requestOrObservable.pipe(
    switchMap(request => httpClient.pipelineRequest(
      request,
      endpointType,
      endpointGuids
    ))
  );
};
