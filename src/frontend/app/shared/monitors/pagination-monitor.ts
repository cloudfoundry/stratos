import { Store } from '@ngrx/store';
import { denormalize, schema } from 'normalizr';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { filter, map, shareReplay } from 'rxjs/operators';
import { withLatestFrom } from 'rxjs/operators/withLatestFrom';

import { getAPIRequestDataState, selectEntities } from '../../store/selectors/api.selectors';
import { selectPaginationState } from '../../store/selectors/pagination.selectors';
import { AppState } from './../../store/app-state';
import { ActionState } from './../../store/reducers/api-request-reducer/types';
import { PaginationEntityState } from './../../store/types/pagination.types';

export class PaginationMonitor<T = any> {
  /**
  * Emits the current page of entities.
  */
  public currentPage$: Observable<T[]>;
  /**
  * Emits a boolean stating if the current page is fetching or not.
  */
  public fetchingCurrentPage$: Observable<boolean>;
  /**
  * Emits a boolean stating if the current page has errored or not.
  */
  public currentPageError$: Observable<boolean>;
  /**
   * All the information about the current pagination selection.
   */
  public pagination$: Observable<PaginationEntityState>;

  constructor(
    private store: Store<AppState>,
    public paginationKey: string,
    public schema: schema.Entity
  ) {
    this.init(
      store,
      paginationKey,
      schema
    );
  }

  /**
   * Is the current page ready?
   * @param pagination
   */
  private hasPage(pagination: PaginationEntityState) {
    const hasPage = pagination && pagination.ids[pagination.currentPage];
    return hasPage;
  }

  /**
   * Does the current page have an error.
   * @param pagination
   */
  private hasError(pagination: PaginationEntityState) {
    return pagination && this.getCurrentPageRequestInfo(pagination).error;
  }

  /**
   * Gets the request info for the current page.
   * @param pagination
   */
  private getCurrentPageRequestInfo(pagination: PaginationEntityState): ActionState {
    if (!pagination || !pagination.pageRequests || !pagination.pageRequests[pagination.currentPage]) {
      return {
        busy: false,
        error: false,
        message: ''
      };
    } else {
      return pagination.pageRequests[pagination.currentPage];
    }
  }

  // ### Initialization methods.
  private init(
    store: Store<AppState>,
    paginationKey: string,
    schema: schema.Entity
  ) {
    this.pagination$ = this.createPaginationObservable(
      store,
      schema.key,
      paginationKey
    );
    this.currentPage$ = this.createPageObservable(
      store,
      this.pagination$,
      schema
    );
    this.currentPageError$ = this.createErrorObservable(this.pagination$);
    this.fetchingCurrentPage$ = this.createFetchingObservable(this.pagination$);
  }

  private createPaginationObservable(
    store: Store<AppState>,
    entityKey: string,
    paginationKey: string
  ) {
    return store.select(selectPaginationState(entityKey, paginationKey)).pipe(shareReplay(1));
  }

  private createPageObservable(
    store: Store<AppState>,
    pagination$: Observable<PaginationEntityState>,
    schema: schema.Entity
  ) {
    return combineLatest(
      pagination$,
      this.store.select(selectEntities<T>(this.schema.key)),
    ).pipe(
      filter(([pagination, entities]) => this.hasPage(pagination)),
      withLatestFrom(this.store.select(getAPIRequestDataState)),
      map(([[pagination, entities], allEntities]) => {
        const page = pagination.ids[pagination.currentPage] || [];
        return page.length ? denormalize(page, [schema], allEntities).filter(ent => !!ent) : [];
      }),
      shareReplay(1)
    );
  }

  private createErrorObservable(pagination$: Observable<PaginationEntityState>) {
    return pagination$.pipe(
      map(pagination => {
        const currentPageRequest = this.getCurrentPageRequestInfo(pagination);
        return !currentPageRequest.busy && currentPageRequest.error;
      })
    );
  }

  private createFetchingObservable(pagination$: Observable<PaginationEntityState>) {
    return pagination$.pipe(
      map(pagination => {
        const currentPageRequest = this.getCurrentPageRequestInfo(pagination);
        return currentPageRequest.busy;
      })
    );
  }
  // ### Initialization methods end.

}

