import { HttpParams, HttpRequest } from '@angular/common/http';
import { range, of, Observable, combineLatest } from 'rxjs';
import { mergeMap, reduce, map, tap } from 'rxjs/operators';
import { PaginatedAction } from '../../types/pagination.types';
import { PipelineHttpClient } from '../pipline-http-client.service';
import { JetstreamResponse } from '../entity-request-pipeline.types';

export interface PaginationPageIteratorConfig<R = any, E = any> {
  // TODO This should also pass page size for apis that use start=&end= params.
  getPaginationParameters: (page: number) => HttpParams;
  getTotalPages: (initialResponses: JetstreamResponse<R>) => number;
  getEntitiesFromResponse: (responses: R) => E[];
}

export class PaginationPageIterator<R = any, E = any> {
  constructor(
    private httpClient: PipelineHttpClient,
    public baseHttpRequest: HttpRequest<JetstreamResponse<R>>,
    public action: PaginatedAction,
    public config: PaginationPageIteratorConfig<R, E>
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
      return of(null);
    }
    return range(2, count).pipe(
      mergeMap(currentPage => this.makeRequest(this.addPageToRequest(currentPage)), 5),
      reduce((acc, res: JetstreamResponse<R>) => {
        return acc;
      }, [] as JetstreamResponse<R>[])
    );
  }

  private addPageToRequest(page: number) {
    return this.baseHttpRequest.clone({
      params: this.config.getPaginationParameters(page)
    });
  }

  public mergeAllPages() {
    const initialRequest = this.addPageToRequest(1);
    return this.makeRequest(initialRequest).pipe(
      mergeMap(initialResponse => {
        const totalPages = this.config.getTotalPages(initialResponse);
        return combineLatest(of(initialResponse), this.getAllOtherPageRequests(totalPages)).pipe(
          map(([initialRequestResponse, othersResponse]) => [initialRequestResponse, ...othersResponse]),
          map(responsePages => responsePages.reduce((mergedResponse, page) => {
            // Merge all 'pages' into one page;
            return Object.keys(page).reduce((responses, endpointId) => {
              const entities = this.config.getEntitiesFromResponse(page[endpointId]);
              if (!responses[endpointId]) {
                responses[endpointId] = [];
              }
              return {
                ...responses,
                [endpointId]: [
                  ...responses[endpointId],
                  ...entities
                ]
              };
            }, mergedResponse);
          }, {} as JetstreamResponse<R[]>))
        );
      }),
    );
  }
}
