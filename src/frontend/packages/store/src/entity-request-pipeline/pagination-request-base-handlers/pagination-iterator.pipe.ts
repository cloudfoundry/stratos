import { HttpRequest } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, range } from 'rxjs';
import { first, map, mergeMap, reduce, switchMap } from 'rxjs/operators';

import { UpdatePaginationMaxedState } from '../../actions/pagination.actions';
import { AppState } from '../../app-state';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { PaginatedAction, PaginationMaxedState } from '../../types/pagination.types';
import { ActionDispatcher, JetstreamResponse, PagedJetstreamResponse } from '../entity-request-pipeline.types';
import { PipelineHttpClient } from '../pipline-http-client.service';


export interface PaginationPageIteratorConfig<R = any, E = any> {
  // TODO This should also pass page size for apis that use start=&end= params.
  getPaginationParameters: (page: number) => Record<string, string>;
  getTotalPages: (initialResponses: JetstreamResponse<R>) => number;
  getTotalEntities: (initialResponses: JetstreamResponse<R>) => number;
  getEntitiesFromResponse: (responses: R) => E[];
  /**
   * After fetching the first page check that the total number of entities does not exceed this number.
   * If so do not fetch other pages and enter 'maxed' error mode
   * Only applicable to 'local' collections (everything is fetch up front and paginated locally)
   */
  maxedStateStartAt: (store: Store<AppState>, action: PaginatedAction) => Observable<number>;
  /**
   * If the collection has entered 'maxed' error mode, can the user ignore and fetch all results regardless (see `maxedStateStartAt`)?
   */
  canIgnoreMaxedState: (store: Store<AppState>) => Observable<boolean>;
}

export class PaginationPageIterator<R = any, E = any> {
  constructor(
    private store: Store<AppState>,
    private httpClient: PipelineHttpClient,
    public baseHttpRequest: HttpRequest<JetstreamResponse<R>>,
    public action: PaginatedAction,
    public actionDispatcher: ActionDispatcher,
    public config: PaginationPageIteratorConfig<R, E>,
    private paginationMaxedState?: PaginationMaxedState
  ) { }

  private makeRequest(httpRequest: HttpRequest<JetstreamResponse<R>>) {
    return this.httpClient.pipelineRequest<JetstreamResponse<R>>(
      httpRequest,
      entityCatalog.getEndpoint(this.action.endpointType, this.action.subType),
      this.action.endpointGuid,
      this.action.externalRequest
    );
  }

  private getAllOtherPageRequests(totalPages: number): Observable<JetstreamResponse<R>[]> {
    const start = 2;
    const count = totalPages - start;
    if (count < 0) {
      return of([]);
    }
    return range(2, count + 1).pipe(
      mergeMap(currentPage => this.makeRequest(this.addPageToRequest(currentPage)), 10),
      reduce((acc, res: JetstreamResponse<R>) => {
        acc.push(res);
        return acc;
      }, [] as JetstreamResponse<R>[])
    );
  }

  private addPageToRequest(page: number) {
    const newParamsObject = this.config.getPaginationParameters(page);
    const newParams = Object.keys(newParamsObject).reduce((params, key) => {
      return params.set(key, newParamsObject[key]);
    }, this.baseHttpRequest.params);
    return this.baseHttpRequest.clone({
      params: newParams
    });
  }

  private reducePages(responsePages: JetstreamResponse<R>[]) {
    return responsePages.reduce((mergedResponse, page) => {
      // Merge all 'pages' into pages of endpoint responses;
      return Object.keys(page).reduce((responses, endpointId) => {
        if (!responses[endpointId]) {
          responses[endpointId] = [];
        }
        return {
          ...responses,
          [endpointId]: [
            ...(responses[endpointId] as any[]),
            page[endpointId]
          ]
        };
      }, mergedResponse);
    }, {} as PagedJetstreamResponse);
  }

  private handleRequests(initialResponse: JetstreamResponse<R>, action: PaginatedAction, totalPages: number, totalResults: number):
    Observable<[JetstreamResponse<R>, JetstreamResponse<R>[]]> {

    const createAllResults = () => combineLatest(of(initialResponse), this.getAllOtherPageRequests(totalPages));
    if (totalResults === 0 || (this.paginationMaxedState && this.paginationMaxedState.ignoreMaxed)) {
      return createAllResults();
    }

    return this.config.maxedStateStartAt(this.store, action).pipe(
      switchMap(maxEntities => {
        if (maxEntities && maxEntities <= totalResults) {
          // We've entered 'maxed' mode. Only respond with the first page of results.
          const { entityType, endpointType, paginationKey } = action;
          const entityKey = entityCatalog.getEntityKey(action);
          // The entity type should always match the pagination key. If in a multi-action list this means that of the action rather than
          // the forced entity
          this.actionDispatcher(
            new UpdatePaginationMaxedState(maxEntities, totalResults, entityType, endpointType, paginationKey, entityKey)
          );
          return combineLatest([of(initialResponse), of([])]);
        }
        return createAllResults();
      })
    );
  }

  private getValidNumber(num: number) {
    return typeof num === 'number' && !isNaN(num) ? num : 0;
  }

  public mergeAllPagesEntities(): Observable<PagedJetstreamResponse> {
    const initialRequest = this.addPageToRequest(1);
    return this.makeRequest(initialRequest).pipe(
      switchMap(initialResponse => {
        const totalPages = this.config.getTotalPages(initialResponse);
        const totalResults = this.config.getTotalEntities(initialResponse);
        return this.handleRequests(
          initialResponse,
          this.action,
          this.getValidNumber(totalPages),
          this.getValidNumber(totalResults)
        ).pipe(
          first(),
          map(([initialRequestResponse, othersResponse]) => [initialRequestResponse, ...othersResponse]),
          map(responsePages => this.reducePages(responsePages)),
        );
      })
    );
  }
}
