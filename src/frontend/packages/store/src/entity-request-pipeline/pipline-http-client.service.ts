import { HttpClient, HttpRequest, HttpEvent, HttpHandler, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { InternalAppState } from '../app-state';
import { Store } from '@ngrx/store';
import { registeredEndpointsOfTypesSelector } from '../selectors/endpoint.selectors';
import { first, mergeMap, last, tap, filter, map } from 'rxjs/operators';

@Injectable()
export class PipelineHttpClient {

  static readonly EndpointHeader = 'x-cap-cnsi-list';

  constructor(
    public httpClient: HttpClient,
    private store: Store<InternalAppState>,
  ) { }
  private getRequest<R>(hr: HttpRequest<any>, endpointType: string, endpointGuids: string | string[] = null) {
    if (endpointGuids && endpointGuids.length) {
      const headers = hr.headers.set(PipelineHttpClient.EndpointHeader, endpointGuids);
      return this.httpClient.request<R>(hr.clone({ headers, reportProgress: false }));
    } else {
      return this.store.select(registeredEndpointsOfTypesSelector(endpointType)).pipe(
        first(),
        mergeMap(endpoints => {
          const headers = hr.headers.set(PipelineHttpClient.EndpointHeader, Object.keys(endpoints));
          return this.httpClient.request<R>(hr.clone({ headers, reportProgress: false }));
        })
      );
    }
  }
  public pipelineRequest<R>(hr: HttpRequest<any>, endpointType: string, endpointGuids: string | string[] = null): Observable<HttpEvent<R>> {
    return this.getRequest<R>(hr, endpointType, endpointGuids).pipe(
      filter(event => event instanceof HttpResponse),
      map((response: HttpResponse<any>) => response.body)
    );
  }

}
