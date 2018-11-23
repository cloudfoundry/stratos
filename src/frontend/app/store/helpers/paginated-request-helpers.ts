import { HttpClient } from '@angular/common/http';
import { Http, Request, RequestOptions, Response } from '@angular/http';
import { forkJoin, Observable, of as observableOf } from 'rxjs';
import { first, map, mergeMap } from 'rxjs/operators';

import { CFResponse } from '../types/api.types';


export interface IPaginationFlattener<T> {
  getTotalPages: (res: T) => number;
  mergePages: (res: T[]) => T;
  fetch: (...args) => Observable<T>;
  buildFetchParams: (i: number) => any[];
}

export class BaseHttpClientFetcher<T = CFResponse> {
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

export class BaseHttpFetcher<T = CFResponse> {
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

export class CfAPIFlattener extends BaseHttpFetcher
  implements IPaginationFlattener<CFResponse> {

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
}


export function flattenPagination<T>(
  firstRequest: Observable<T>,
  flattener: IPaginationFlattener<T>,
) {
  return firstRequest.pipe(
    first(),
    mergeMap(firstResData => {
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
