import { HttpClient, type HttpRequest, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { filter, first, map, mergeMap } from 'rxjs/operators';

import type { InternalAppState } from '../app-state';
import type { StratosCatalogEndpointEntity } from '../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import type { IStratosEndpointDefinition } from '../entity-catalog/entity-catalog.types';
import { cfAPIVersion, proxyAPIVersion } from '../jetstream';
import { connectedEndpointsOfTypesSelector, endpointOfTypeSelector } from '../selectors/endpoint.selectors';

@Injectable({
  providedIn: 'root'
})
export class PipelineHttpClient {

  static readonly EndpointHeader = 'x-cap-cnsi-list';
  public httpClient = inject(HttpClient);
  private store = inject(Store<InternalAppState>);

  private makeRequest<_R>(
    hr: HttpRequest<unknown>,
    endpointConfig: IStratosEndpointDefinition,
    endpointGuids: string | string[] = null,
    externalRequest = false
  ) {
    if (externalRequest) {
      return this.externalRequest(hr);
    }
    return this.jetstreamRequest(hr, endpointConfig, endpointGuids);
  }

  private jetstreamRequest<R>(
    hr: HttpRequest<unknown>,
    endpointConfig: IStratosEndpointDefinition,
    endpointGuids: string | string[]) {
    const url = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${hr.url}`;
    if (endpointGuids?.length) {
      const headers = hr.headers.set(PipelineHttpClient.EndpointHeader, endpointGuids);
      return this.httpClient.request<R>(hr.clone({ headers, url }));
    } else {
      const selector = endpointConfig.unConnectable ?
        endpointOfTypeSelector(endpointConfig.type) :
        connectedEndpointsOfTypesSelector(endpointConfig.type);

      return this.store.select(selector).pipe(
        first(),
        mergeMap(endpoints => {
          const headers = hr.headers.set(PipelineHttpClient.EndpointHeader, Object.keys(endpoints));
          return this.httpClient.request<R>(hr.clone({ headers, url }));
        })
      );
    }
  }

  private externalRequest<R>(hr: HttpRequest<unknown>) {
    return this.httpClient.request<R>(hr);
  }

  public pipelineRequest<R>(
    hr: HttpRequest<unknown>,
    endpointConfig: StratosCatalogEndpointEntity,
    endpointGuids: string | string[] = null,
    externalRequest = false
  ): Observable<R> {
    return this.makeRequest<R>(hr, endpointConfig.definition, endpointGuids, externalRequest).pipe(
      filter(event => event instanceof HttpResponse),
      map((response: HttpResponse<R>) => response.body)
    );
  }

}
