import { HttpClient, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take, filter, map, mergeMap } from 'rxjs/operators';

import { InternalAppState } from '../app-state';
import { StratosCatalogEndpointEntity } from '../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IStratosEndpointDefinition } from '../entity-catalog/entity-catalog.types';
import { cfAPIVersion, proxyAPIVersion } from '../jetstream';
import { connectedEndpointsOfTypesSelector, endpointOfTypeSelector } from '../selectors/endpoint.selectors';
import { resolvePipelineUrl } from './resolve-pipeline-url';

/**
 * V3-native pipeline URLs use the convention
 *   /pp/v1/cf/<resource>/<cnsiGuid>/<...>
 * so the cnsiGuid is the segment immediately after the resource name. Returns
 * null if the URL doesn't match the expected shape.
 */
function extractCnsiFromAbsoluteUrl(url: string): string | null {
  const match = url.match(/\/pp\/v1\/cf\/[^/?]+\/([^/?]+)/);
  return match ? match[1] : null;
}

@Injectable({
  providedIn: 'root'
})
export class PipelineHttpClient {

  static readonly EndpointHeader = 'x-cap-cnsi-list';
  public httpClient = inject(HttpClient);
  private store = inject(Store<InternalAppState>);

  private makeRequest<R>(
    hr: HttpRequest<any>,
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
    hr: HttpRequest<any>,
    endpointConfig: IStratosEndpointDefinition,
    endpointGuids: string | string[]) {
    const { url, isAbsolute } = resolvePipelineUrl(hr.url, proxyAPIVersion, cfAPIVersion);
    if (isAbsolute) {
      // V3-native single-endpoint paths (`/pp/v1/cf/<resource>/<cnsiGuid>/...`)
      // bypass the multi-endpoint x-cap-cnsi-list header and return raw data
      // instead of the `{[cnsiGuid]: data}` envelope the legacy proxy uses.
      // Wrap the response so the rest of the pipeline (singleRequestToPaged,
      // mapJetstreamResponses) sees the expected per-endpoint shape.
      const cnsiGuid = extractCnsiFromAbsoluteUrl(url);
      return this.httpClient.request<R>(hr.clone({ url })).pipe(
        map(event => {
          if (event instanceof HttpResponse && cnsiGuid) {
            const wrapped = { [cnsiGuid]: event.body } as unknown as R;
            return event.clone({ body: wrapped });
          }
          return event;
        })
      );
    }
    if (endpointGuids && endpointGuids.length) {
      const headers = hr.headers.set(PipelineHttpClient.EndpointHeader, endpointGuids);
      return this.httpClient.request<R>(hr.clone({ headers, url }));
    } else {
      const selector = endpointConfig.unConnectable ?
        endpointOfTypeSelector(endpointConfig.type) :
        connectedEndpointsOfTypesSelector(endpointConfig.type);

      return this.store.select(selector).pipe(
        take(1),
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
