import { HttpClient, HttpRequest } from '@angular/common/http';
import { forkJoin, Observable, of as observableOf } from 'rxjs';
import { first, map, mergeMap } from 'rxjs/operators';

import { UpdatePaginationMaxedState } from '../actions/pagination.actions';
import { ActionDispatcher } from '../entity-request-pipeline/entity-request-pipeline.types';


// TODO: See #4208. This should be replaced with
// src/frontend/packages/store/src/entity-request-pipeline/pagination-request-base-handlers/pagination-iterator.pipe.ts

export interface PaginationFlattenerConfig<T = any, C = any> extends Pick<
  PaginationFlattener<T, C>,
  'getTotalPages' | 'getTotalResults' | 'mergePages' | 'clearResults'
  > { }

export interface PaginationFlattener<T = any, C = any> {
  getTotalPages: (res: C) => number;
  getTotalResults: (res: C) => number;
  mergePages: (res: T[]) => T;
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
      // Discover the endpoint with the most pages. This is the amount of request we will need to make to fetch all pages from all
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
    map((responses: T[]) => {
      // Merge all responses into the first page
      return flattener.mergePages(responses);
    }),
  );
}
