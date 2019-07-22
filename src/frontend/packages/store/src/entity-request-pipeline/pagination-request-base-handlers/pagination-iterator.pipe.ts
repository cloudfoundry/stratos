import { HttpParams, HttpRequest } from '@angular/common/http';
import { range } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { PaginatedAction } from '../../types/pagination.types';
import { PipelineHttpClient } from '../pipline-http-client.service';

export interface PaginationPageIteratorConfig<R = any, E = any> {
  getPaginationParameters: (page: number, initialResponse: R) => HttpParams;
  getTotalPages: (initialResponse: R) => number;
  getEntitiesFromResponse: (responses: R) => E[];
}

export class PaginationPageIterator<R = any, E = any> {
  constructor(
    private httpClient: PipelineHttpClient,
    public baseHttpRequest: HttpRequest<R>,
    public action: PaginatedAction,
    public config: PaginationPageIteratorConfig<R, E>
  ) { }

  private makeRequest(httpRequest: HttpRequest<R>) {
    return this.httpClient.pipelineRequest<R>(
      httpRequest,
      this.action.endpointType,
      this.action.endpointGuid
    );
  }

  private getAllOtherPageRequests(totalPages: number, initialResponse: R) {
    return range(1, totalPages).pipe(
      mergeMap(currentPage => this.makeRequest(this.baseHttpRequest.clone({
        params: this.config.getPaginationParameters(currentPage, initialResponse)
      })), 5)
    );
  }

  public mergeAllPages() {
    return this.makeRequest(this.baseHttpRequest).pipe(
      mergeMap(initialResponse => {
        const totalPages = this.config.getTotalPages(initialResponse);
        return this.getAllOtherPageRequests(totalPages, initialResponse)
        // const allPagesResults = [of(initialResponse), ...this.getAllOtherPageRequests(totalPages, initialResponse)];
        // return combineLatest(allPagesResults);
      }),
      // map(responses => responses.map(response => this.config.getEntitiesFromResponse(response))),
      // map(entities => [].concat(...entities) as E[])
    );
  }
}