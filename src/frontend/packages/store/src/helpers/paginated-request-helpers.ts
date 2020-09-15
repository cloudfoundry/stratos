import { HttpClient, HttpRequest, HttpResponse } from '@angular/common/http';
import { forkJoin, Observable, of as observableOf, of } from 'rxjs';
import { first, map, mergeMap, switchMap } from 'rxjs/operators';

import { UpdatePaginationMaxedState } from '../actions/pagination.actions';
import { ActionDispatcher } from '../entity-request-pipeline/entity-request-pipeline.types';


// TODO: See #4208. This should be replaced with
// src/frontend/packages/store/src/entity-request-pipeline/pagination-request-base-handlers/pagination-iterator.pipe.ts

export interface PaginationFlattener<T = any, C = any> {
  getTotalPages: (res: C) => number;
  getTotalResults: (res: C) => number;
  mergePages: (res: C[]) => T;
  fetch: (...args) => Observable<C>;
  buildFetchParams: (i: number) => any[];
  clearResults: (res: C, allResults: number) => Observable<C>;
}

export class BaseHttpClientFetcher<T> {
  constructor(
    private httpClient: HttpClient,
    public url: string,
    public requestOptions: { [key: string]: any },
    private pageUrlParam: string
  ) { }
  public fetch(url: string, options: { [key: string]: any }) {
    return this.httpClient.get<T>(
      url,
      options
    );
  }
  public buildFetchParams(i: number) {
    const requestOption = {
      ...this.requestOptions,
      params: {
        ...(this.requestOptions.params || {}),
        [this.pageUrlParam]: i.toString()
      }
    };
    return [this.url, requestOption];
  }
}

export class BaseHttpFetcher {
  constructor(
    private http: HttpClient,
    private requestOptions: HttpRequest<any>,
    private pageUrlParam: string
  ) { }

  public fetch(options: HttpRequest<any>): Observable<any> {
    return this.http.request(options);
  }

  public buildFetchParams(i: number) {
    const requestOption = { ...this.requestOptions } as HttpRequest<any>;
    requestOption.params.set(this.pageUrlParam, i.toString());
    return [requestOption];
  }
}

/**
 * T is what we get back per request, C is what we return in the observable
 */
export interface IteratePaginationConfig<T, C> {
  getFirst: (url: string) => Observable<HttpResponse<T>>;
  getNext: (response: HttpResponse<T>) => Observable<HttpResponse<T>>;
  getResult: (response: HttpResponse<T>) => C[];
}
/**
 * T is what we get back per request, C is what we return in the observable
 */
export function iteratePagination<T, C>(
  results: C[] = [],
  request: Observable<HttpResponse<T>>,
  iterator: IteratePaginationConfig<T, C>
): Observable<C[]> {
  return request.pipe(
    first(),
    switchMap(response => {
      const nextRequest = iterator.getNext(response);
      results.push(...iterator.getResult(response));
      if (!nextRequest) {
        return of(results);
      }
      return iteratePagination<T, C>(
        results,
        nextRequest,
        iterator
      );
    }),
  );
}

export function flattenPagination<T, C>(
  actionDispatcher: ActionDispatcher,
  firstRequest: Observable<C>,
  flattener: PaginationFlattener<T, C>,
  maxCount?: number,
  entityType?: string,
  endpointType?: string,
  paginationKey?: string,
  forcedEntityKey?: string
) {
  return firstRequest.pipe(
    first(),
    mergeMap(firstResData => {
      const allResults = flattener.getTotalResults(firstResData);
      if (maxCount) {
        // Note - This isn't ever being used, maxCount is always undefined. See #4208
        actionDispatcher(
          new UpdatePaginationMaxedState(maxCount, allResults, entityType, endpointType, paginationKey, forcedEntityKey)
        );
        if (allResults > maxCount) {
          // If we have too many results only return basic first page information
          return forkJoin([flattener.clearResults(firstResData, allResults)]);
        }
      }
      // Make those requests
      const maxRequests = flattener.getTotalPages(firstResData);
      const requests = [];
      requests.push(observableOf(firstResData)); // Already made the first request, don't repeat it
      for (let i = 2; i <= maxRequests; i++) {
        // Make any additional page requests
        const requestOptions = flattener.buildFetchParams(i);
        requests.push(flattener.fetch(...requestOptions));
      }
      return forkJoin(requests);
    }),
    map((responses: C[]) => {
      // Merge all responses into the first page
      return flattener.mergePages(responses);
    }),
  );
}
