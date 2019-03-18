import { HttpClient } from '@angular/common/http';
import { Http, Request, RequestOptions, Response } from '@angular/http';
import { Store } from '@ngrx/store';
import { forkJoin, Observable, of as observableOf } from 'rxjs';
import { first, map, mergeMap } from 'rxjs/operators';

import { UpdatePaginationMaxedState } from '../actions/pagination.actions';
import { AppState } from '../app-state';
import { CFResponse } from '../types/api.types';


export interface IPaginationFlattener<T, C> {
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
    public url,
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
    private http: Http,
    private requestOptions: RequestOptions,
    private pageUrlParam: string
  ) { }

  private getJsonData(response: Response) {
    try {
      return response.json();
    } catch (e) {
      return null;
    }
  }

  public fetch(options: RequestOptions): Observable<any> {
    return this.http.request(new Request(options)).pipe(
      map(this.getJsonData),
    );
  }

  public buildFetchParams(i: number) {
    const requestOption = { ...this.requestOptions } as RequestOptions;
    requestOption.params.set(this.pageUrlParam, i.toString());
    return [requestOption];
  }
}

export class CfAPIFlattener extends BaseHttpFetcher implements IPaginationFlattener<CFResponse, { [cfGuid: string]: CFResponse }> {

  constructor(http: Http, requestOptions: RequestOptions) {
    super(http, requestOptions, 'page');
  }
  public getTotalPages = res =>
    Object.keys(res).reduce((max, endpointGuid) => {
      const endpoint = res[endpointGuid];
      return max < endpoint.total_pages ? endpoint.total_pages : max;
    }, 0)
  public mergePages = (responses: CFResponse[]) => {
    // Merge all responses into the first page
    const newResData = responses[0];
    const endpointGuids = Object.keys(newResData);
    for (let i = 1; i < responses.length; i++) {
      // Make any additional page requests
      const endpointResponse = responses[i];
      endpointGuids.forEach(endpointGuid => {
        const endpoint = endpointResponse[endpointGuid];
        if (endpoint && endpoint.resources && endpoint.resources.length) {
          newResData[endpointGuid].resources = newResData[
            endpointGuid
          ].resources.concat(endpoint.resources);
        }
      });
    }
    return newResData;
  }
  public getTotalResults = res => {
    return Object.keys(res).reduce((count, endpointGuid) => {
      const endpoint: CFResponse = res[endpointGuid];
      return count + endpoint.total_results;
    }, 0);
  }
  public clearResults = (res: { [cfGuid: string]: CFResponse }, allResults: number): Observable<any> => {
    Object.keys(res).forEach(endpointKey => {
      const endpoint = res[endpointKey];
      endpoint.total_pages = 1;
    });
    return observableOf(res);
  }
}


export function flattenPagination<T, C>(
  store: Store<AppState>,
  firstRequest: Observable<C>,
  flattener: IPaginationFlattener<T, C>,
  maxCount?: number,
  entityKey?: string,
  paginationKey?: string,
  forcedEntityKey?: string
) {
  return firstRequest.pipe(
    first(),
    mergeMap(firstResData => {
      const allResults = flattener.getTotalResults(firstResData);
      if (maxCount) {
        store.dispatch(new UpdatePaginationMaxedState(maxCount, allResults, entityKey, paginationKey, forcedEntityKey));
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
