import { HttpClient, HttpResponse } from '@angular/common/http';
import { PaginationFlattener } from '@stratosui/store';
import { Observable } from 'rxjs';

import { HttpOptions } from '../../../../core/src/core/core.types';

// --------------- Note ----------------
// There are two types of pagination github uses
// 1) Pagination info is in the body of the response (GithubPaginationResponse / GithubFlattenerPaginationConfig)
//    - Array is in the body of the response
//    - Things like total number of results in the body of the response
// 2) Pagination info is in the response header (GithubPaginationArrayResponse / GithubFlattenerForArrayPaginationConfig)
//    - Array is the body of the response
//    - Thinks like total number of results are in a `link` property in the response header


/**
 * Body of a github pagination response (pagination info inside body)
 */
type GithubPaginationResponse<T = any> = {
  incomplete_results: boolean,
  items: T[],
  total_count: number,
};

/**
 * Body of a github pagination response (pagination info is in header)
 */
type GithubPaginationArrayResponse<T = any> = T[];

export const GITHUB_PER_PAGE_PARAM = 'per_page';
export const GITHUB_PER_PAGE_PARAM_VALUE = 100;
const GITHUB_MAX_PAGES = 5;
const GITHUB_PAGE_PARAM = 'page';
const GITHUB_LINK_PAGE_REGEX = /page=([\d]*)/;

/**
 * Config used with `flattenPagination`. To use when the pagination info is in the body
 */
export class GithubFlattenerPaginationConfig<T> implements PaginationFlattener<T[], GithubPaginationResponse<T>> {
  constructor(
    private httpClient: HttpClient,
    public url: string,
    private options: HttpOptions,
  ) { }

  getTotalPages = (res: GithubPaginationResponse<T>): number => {
    const total = Math.floor(this.getTotalResults(res) / GITHUB_PER_PAGE_PARAM_VALUE) + 1;
    if (total > GITHUB_MAX_PAGES) {
      console.warn(`Not fetching all github entities (too many pages: ${total})`);
      return GITHUB_MAX_PAGES;
    }
    return total;
  };
  getTotalResults = (res: GithubPaginationResponse<T>): number => {
    return res.total_count;
  };
  mergePages = (response: any[]): T[] => {
    return response.reduce((all, res) => {
      return all.concat(...res.items);
    }, [] as T[]);
  };
  fetch = (...args: any[]): Observable<GithubPaginationResponse<T>> => {
    return this.httpClient.get<GithubPaginationResponse<T>>(
      this.url,
      {
        ...this.options,
        params: {
          ...args[0]
        },
      }
    );
  };
  buildFetchParams = (i: number): any[] => {
    const requestOption = {
      [GITHUB_PAGE_PARAM]: i.toString(),
      [GITHUB_PER_PAGE_PARAM]: GITHUB_PER_PAGE_PARAM_VALUE.toString()
    };
    return [requestOption];
  };
  clearResults = (res: GithubPaginationResponse<T>, allResults: number) => {
    throw new Error('Not Implemented');
  };
}

/**
 * Config used with `flattenPagination`. To use when the pagination info in the response header
 */
export class GithubFlattenerForArrayPaginationConfig<T>
  implements PaginationFlattener<GithubPaginationArrayResponse<T>, HttpResponse<GithubPaginationArrayResponse<T>>> {
  constructor(
    private httpClient: HttpClient,
    public url: string,
    private options: HttpOptions,
  ) { }

  getTotalPages = (res: HttpResponse<GithubPaginationArrayResponse<T>>): number => {
    // Link: <https://api.github.com/search/code?q=addClass+user%3Amozilla&page=2>; rel="next",
    // <https://api.github.com/search/code?q=addClass+user%3Amozilla&page=34>; rel="last"

    const link = res.headers.get('link');
    if (!link) {
      // There's no `link` if there's only one page.....
      return 1;
    }
    const parts = link.split(',');
    if (!parts.length) {
      throw new Error('Unable to depagination github request (no commas in `link`)');
    }
    const last = parts.find(part => part.endsWith('rel="last"'));
    if (!last) {
      throw new Error('Unable to depagination github request (no `last` in `link`)');
    }
    const trimmedLast = last.trim();
    const lastUrl = trimmedLast.slice(1, trimmedLast.indexOf('>'));
    const lastPageNumber = GITHUB_LINK_PAGE_REGEX.exec(lastUrl);
    if (lastPageNumber.length < 2) {
      throw new Error(`Unable to depagination github request (could not find page number in ${lastUrl})`);
    }

    const total = parseInt(lastPageNumber[1], 10);
    if (total > GITHUB_MAX_PAGES) {
      console.warn(`Not fetching all github entities (too many pages: ${total})`);
      return GITHUB_MAX_PAGES;
    }
    return total;
  };
  getTotalResults = (res: HttpResponse<GithubPaginationArrayResponse<T>>): number => {
    return this.getTotalPages(res) * GITHUB_PER_PAGE_PARAM_VALUE;
  };
  mergePages = (response: any[]): GithubPaginationArrayResponse<T> => {
    return response.reduce((all, res) => {
      return all.concat(...res.body);
    }, [] as GithubPaginationArrayResponse<T>);
  };
  fetch = (...args: any[]): Observable<HttpResponse<GithubPaginationArrayResponse<T>>> => {
    return this.httpClient.get<GithubPaginationArrayResponse<T>>(
      this.url,
      {
        ...this.options,
        params: {
          ...args[0]
        },
        // Required to ensure we can access the https response header
        observe: 'response'
      }
    );
  };
  buildFetchParams = (i: number): any[] => {
    const requestOption = {
      [GITHUB_PAGE_PARAM]: i.toString(),
      [GITHUB_PER_PAGE_PARAM]: GITHUB_PER_PAGE_PARAM_VALUE.toString()
    };
    return [requestOption];
  };
  clearResults = (res: HttpResponse<GithubPaginationArrayResponse<T>>, allResults: number) => {
    throw new Error('Not Implemented');
  };
}