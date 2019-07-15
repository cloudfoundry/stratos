import { MakeEntityRequestPipe } from '../entity-request-pipeline.types';
import { HttpRequest } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';

export const makeRequestEntityPipe: MakeEntityRequestPipe = (
  httpClient,
  requestOrObservable
) => {
  if (requestOrObservable instanceof HttpRequest) {
    return httpClient.request(requestOrObservable);
  }
  return requestOrObservable.pipe(
    switchMap(request => httpClient.request(request))
  );
};
