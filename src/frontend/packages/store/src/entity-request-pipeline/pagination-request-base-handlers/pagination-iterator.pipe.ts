import { HttpRequest } from '@angular/common/http';
import { range, of, Observable, combineLatest } from 'rxjs';
import { mergeMap, reduce, map, tap } from 'rxjs/operators';
import { PaginatedAction } from '../../types/pagination.types';
import { PipelineHttpClient } from '../pipline-http-client.service';
import {
  JetstreamResponse,
  ActionDispatcher,
  SuccessfulApiResponseDataMapper,
  PagedJetstreamResponse
} from '../entity-request-pipeline.types';
import { UpdatePaginationMaxedState } from '../../actions/pagination.actions';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';

export interface PaginationPageIteratorConfig<R = any, E = any> {
  // TODO This should also pass page size for apis that use start=&end= params.
  getPaginationParameters: (page: number) => Record<string, string>;
  getTotalPages: (initialResponses: JetstreamResponse<R>) => number;
  getEntityCount: (initialResponses: JetstreamResponse<R>) => number;
  getEntitiesFromResponse: (responses: R) => E[];
}

export class PaginationPageIterator<R = any, E = any> {
  constructor(
    private httpClient: PipelineHttpClient,
    public baseHttpRequest: HttpRequest<JetstreamResponse<R>>,
    public action: PaginatedAction,
    public actionDispatcher: ActionDispatcher,
    public config: PaginationPageIteratorConfig<R, E>,
    public postSuccessDataMapper?: SuccessfulApiResponseDataMapper<E>
  ) { }

  private makeRequest(httpRequest: HttpRequest<JetstreamResponse<R>>) {
    return this.httpClient.pipelineRequest<JetstreamResponse<R>>(
      httpRequest,
      this.action.endpointType,
      this.action.endpointGuid
    );
  }

  private getAllOtherPageRequests(totalPages: number): Observable<JetstreamResponse<R>[]> {
    const start = 2;
    const count = totalPages - start;
    if (!count) {
      return of([]);
    }
    return range(2, count).pipe(
      mergeMap(currentPage => this.makeRequest(this.addPageToRequest(currentPage)), 5),
      reduce((acc, res: JetstreamResponse<R>) => {
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

  private handleRequests(initialResponse: JetstreamResponse<R>, action: PaginatedAction, totalPages: number, totalResults: number) {
    const maxCount = action.flattenPaginationMax;
    // We're maxed so only respond with the first page of results.
    if (maxCount < totalResults) {
      const { entityType, endpointType, paginationKey, __forcedPageEntityConfig__ } = action;
      const forcedEntityKey = entityCatalogue.getEntityKey(__forcedPageEntityConfig__);
      this.actionDispatcher(
        new UpdatePaginationMaxedState(maxCount, totalResults, entityType, endpointType, paginationKey, forcedEntityKey)
      );
      of([initialResponse]);
    }
    return combineLatest(of(initialResponse), this.getAllOtherPageRequests(totalPages));
  }

  public mergeAllPagesEntities(): Observable<PagedJetstreamResponse> {
    const initialRequest = this.addPageToRequest(1);
    return this.makeRequest(initialRequest).pipe(
      mergeMap(initialResponse => {
        const totalPages = this.config.getTotalPages(initialResponse);
        const totalResults = this.config.getEntityCount(initialResponse);
        return this.handleRequests(
          initialResponse,
          this.action,
          totalPages,
          totalResults
        ).pipe(
          map(([initialRequestResponse, othersResponse]) => [initialRequestResponse, ...othersResponse]),
          map(responsePages => this.reducePages(responsePages))
        );
      })
    );
  }
}
