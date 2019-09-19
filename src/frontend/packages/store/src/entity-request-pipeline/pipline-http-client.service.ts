import { HttpClient, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, mergeMap } from 'rxjs/operators';
import { InternalAppState } from '../app-state';
import { registeredEndpointsOfTypesSelector } from '../selectors/endpoint.selectors';
import { environment } from '../../../core/src/environments/environment';

const { proxyAPIVersion, cfAPIVersion } = environment;

@Injectable()
export class PipelineHttpClient {

  static readonly EndpointHeader = 'x-cap-cnsi-list';

  constructor(
    public httpClient: HttpClient,
    private store: Store<InternalAppState>,
  ) { }

  private makeRequest<R>(hr: HttpRequest<any>, endpointType: string, endpointGuids: string | string[] = null, externalRequest = false) {
    if (externalRequest) {
      return this.externalRequest(hr);
    }
    return this.jetstreamRequest(hr, endpointType, endpointGuids);
  }

  private jetstreamRequest<R>(hr: HttpRequest<any>, endpointType: string, endpointGuids: string | string[]) {
    const url = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${hr.url}`;
    if (endpointGuids && endpointGuids.length) {
      const headers = hr.headers.set(PipelineHttpClient.EndpointHeader, endpointGuids);
      return this.httpClient.request<R>(hr.clone({ headers, url }));
    } else {
      return this.store.select(registeredEndpointsOfTypesSelector(endpointType)).pipe(
        first(),
        mergeMap(endpoints => {
          const headers = hr.headers.set(PipelineHttpClient.EndpointHeader, Object.keys(endpoints));
          return this.httpClient.request<R>(hr.clone({ headers, url }));
        })
      );
    }
  }

  private externalRequest<R>(hr: HttpRequest<any>) {
    return this.httpClient.request<R>(hr);
  }

  public pipelineRequest<R>(
    hr: HttpRequest<any>,
    endpointType: string,
    endpointGuids: string | string[] = null,
    externalRequest = false
  ): Observable<R> {
    return this.makeRequest<R>(hr, endpointType, endpointGuids, externalRequest).pipe(
      filter(event => event instanceof HttpResponse),
      map((response: HttpResponse<R>) => response.body)
    );
  }

}
