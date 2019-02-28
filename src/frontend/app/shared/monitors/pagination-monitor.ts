import { Store } from '@ngrx/store';
import { denormalize, schema as normalizrSchema } from 'normalizr';
import { asapScheduler, Observable, combineLatest } from 'rxjs';
import { tag } from 'rxjs-spy/operators';
import {
  combineLatest as combineLatestOperator,
  distinctUntilChanged,
  filter,
  map,
  observeOn,
  publishReplay,
  refCount,
  withLatestFrom,
  switchMap,
  tap,
} from 'rxjs/operators';

import { AppState } from '../../store/app-state';
import { ActionState, ListActionState } from '../../store/reducers/api-request-reducer/types';
import { getAPIRequestDataState, selectEntities } from '../../store/selectors/api.selectors';
import { selectPaginationState } from '../../store/selectors/pagination.selectors';
import { PaginationEntityState } from '../../store/types/pagination.types';
import { entityFactory } from '../../store/helpers/entity-factory';
import { IRequestDataState } from '../../store/types/entity.types';

export interface IMultiActionListEntity {
  entity: any;
  schemaKey: string;
}
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


  public currentPageIds$: Observable<string[]>;
  public multiActionPage$: Observable<IMultiActionListEntity[]>;

  constructor(
    private store: Store<AppState>,
    public paginationKey: string,
    public schema: normalizrSchema.Entity,
    public isLocal = false
  ) {
    this.init(store, paginationKey, schema);
  }

  /**
   * Is the current page ready?
   * @param pagination
   */
  private hasPage(pagination: PaginationEntityState) {
    if (!pagination) {
      return false;
    }
    const currentPage = pagination.ids[pagination.currentPage];
    const hasPageIds = !!currentPage;
    const requestInfo =
      pagination.pageRequests[pagination.clientPagination.currentPage];
    const hasPageRequestInfo = !!requestInfo;
    const hasPage = hasPageIds && (!hasPageRequestInfo || !requestInfo.busy);
    return hasPage;
  }

  /**
   * Gets the request info for the current page.
   * @param pagination
   */
  private getCurrentPageRequestInfo(
    pagination: PaginationEntityState,
  ): ActionState {
    if (
      !pagination ||
      !pagination.pageRequests ||
      !pagination.pageRequests[pagination.currentPage]
    ) {
      return {
        busy: true,
        error: false,
        message: '',
      };
    } else {
      return pagination.pageRequests[pagination.currentPage];
    }
  }

  // ### Initialization methods.
  private init(
    store: Store<AppState>,
    paginationKey: string,
    schema: normalizrSchema.Entity,
  ) {
    this.pagination$ = this.createPaginationObservable(
      store,
      schema.key,
      paginationKey,
    );
    this.currentPageIds$ = this.createPagIdObservable(this.pagination$);
    if (this.isLocal) {
      this.fetchingCurrentPage$ = this.createLocalFetchingObservable(this.pagination$);
      const { entities$, multiActionPage$ } = this.createLocalPageObservable(this.pagination$, schema, this.fetchingCurrentPage$);
      this.currentPage$ = entities$;
      this.multiActionPage$ = multiActionPage$;
    } else {
      this.fetchingCurrentPage$ = this.createFetchingObservable(this.pagination$);
      this.currentPage$ = this.createPageObservable(this.pagination$, schema);
    }
    this.currentPageError$ = this.createErrorObservable(this.pagination$);

  }

  private createPaginationObservable(
    store: Store<AppState>,
    entityKey: string,
    paginationKey: string,
  ) {
    return store.select(selectPaginationState(entityKey, paginationKey)).pipe(
      distinctUntilChanged(),
      filter(pag => !!pag),
    );
  }

  private createPagIdObservable(
    pagination$: Observable<PaginationEntityState>
  ) {
    return pagination$.pipe(
      distinctUntilChanged(this.isPageSameIsh),
      map(pagination => pagination.ids[pagination.currentPage] || [])
    );
  }

  private createPageObservable(
    pagination$: Observable<PaginationEntityState>,
    schema: normalizrSchema.Entity,
  ) {
    const entityObservable$ = this.store
      .select(selectEntities<T>(this.schema.key))
      .pipe(distinctUntilChanged());
    const allEntitiesObservable$ = this.store.select(getAPIRequestDataState);
    return pagination$.pipe(
      // Improve efficiency
      observeOn(asapScheduler),
      filter(pagination => this.hasPage(pagination) && !pagination.currentlyMaxed),
      distinctUntilChanged(this.isPageSameIsh),
      combineLatestOperator(entityObservable$),
      withLatestFrom(allEntitiesObservable$),
      map(([[pagination], allEntities]) => {
        const { page, pageSchema } = this.getPageInfo(pagination, pagination.currentPage, schema);
        return this.denormalizePage(page, pageSchema, allEntities);
      }),
      tag('de-norming ' + schema.key),
      publishReplay(1),
      refCount(),
    );
  }

  private createLocalPageObservable(
    pagination$: Observable<PaginationEntityState>,
    schema: normalizrSchema.Entity,
    fetching$: Observable<boolean>
  ) {

    const entityObservable$ =
      pagination$.pipe(
        switchMap(pagination => {
          return combineLatest(Object.keys(pagination.ids).map((pageNumber) => {
            const { pageSchema } = this.getPageInfo(pagination, pageNumber, schema);
            return this.store.select(selectEntities<T>(pageSchema.key)).pipe(distinctUntilChanged());
          }));
        }),
        map(allPages => allPages.reduce((mergedPages, page) => ({
          ...mergedPages,
          ...page
        }), {}))
      );

    const allEntitiesObservable$ = this.store.select(getAPIRequestDataState);

    const baseObs$ = pagination$.pipe(
      distinctUntilChanged(),
      // Improve efficiency
      observeOn(asapScheduler),
      combineLatestOperator(entityObservable$),
      withLatestFrom(allEntitiesObservable$),
      map(([[pagination], allEntities]) => {
        if (pagination.forcedLocalPage) {
          const { page, pageSchema } = this.getPageInfo(pagination, pagination.forcedLocalPage, schema);
          return {
            [pageSchema.key]: this.denormalizePage(page, pageSchema, allEntities)
          };
        }
        return Object.keys(pagination.ids).reduce((allPageEntities, pageNumber) => {
          const { page, pageSchema } = this.getPageInfo(pagination, pageNumber, schema);
          return {
            ...allPageEntities,
            [pageSchema.key]: this.denormalizePage(page, pageSchema, allEntities)
          };
        }, {});
      }),
      tag('de-norming-local ' + schema.key),
    );

    const multiActionPage$ = baseObs$.pipe<IMultiActionListEntity[]>(
      map(entityMap => {
        return Object.keys(entityMap).reduce((multiActionPage, schemaKey) => {
          return entityMap[schemaKey].reduce((page: IMultiActionListEntity[], entity: any) => {
            return [
              ...page,
              {
                entity,
                schemaKey
              }
            ];
          }, multiActionPage);
        }, [] as IMultiActionListEntity[]);
      })
    );

    const entities$ = baseObs$.pipe(
      map(entityMap => {
        return Object.values(entityMap).reduce((mappedEntities, entities) => {
          return [
            ...mappedEntities,
            ...entities
          ];
        }, []);
      })
    );
    return {
      entities$: fetching$.pipe(
        filter(busy => !busy),
        switchMap(() => entities$),
        publishReplay(1),
        refCount(),
      ),
      multiActionPage$
    };
  }

  private denormalizePage(page: string[], schema: normalizrSchema.Entity, allEntities: IRequestDataState) {
    return page.length
      ? denormalize(page, [schema], allEntities).filter(ent => !!ent)
      : [];
  }

  private getPageInfo(pagination: PaginationEntityState, pageId: number | string, defaultSchema: normalizrSchema.Entity) {
    const page = pagination.ids[pageId] || [];
    const pageState = pagination.pageRequests[pageId] || {} as ListActionState;
    const pageSchema = pageState.schemaKey ? entityFactory(pageState.schemaKey) : defaultSchema;
    return {
      page,
      pageSchema
    };
  }

  private isPageSameIsh(x: PaginationEntityState, y: PaginationEntityState) {
    const samePage = x.currentPage === y.currentPage;
    // It's possible that we need to compare the whole page request object but busy will do for now.
    const samePageBusyState =
      samePage &&
      (
        x.pageRequests[x.currentPage]
        &&
        x.pageRequests[x.currentPage].busy
      ) === (
        y.pageRequests[y.currentPage]
        &&
        y.pageRequests[y.currentPage].busy
      );
    const samePageIdList =
      samePage && x.ids[x.currentPage] === y.ids[y.currentPage];
    return samePageIdList && samePageBusyState;
  }

  private createErrorObservable(
    pagination$: Observable<PaginationEntityState>,
  ) {
    return pagination$.pipe(
      map(pagination => {
        const currentPageRequest = this.getCurrentPageRequestInfo(pagination);
        return !currentPageRequest.busy && currentPageRequest.error;
      }),
    );
  }

  private createFetchingObservable(
    pagination$: Observable<PaginationEntityState>,
  ) {
    return pagination$.pipe(
      map(pagination => {
        const currentPageRequest = this.getCurrentPageRequestInfo(pagination);
        return currentPageRequest.busy;
      }),
      distinctUntilChanged(),
    );
  }

  private createLocalFetchingObservable(
    pagination$: Observable<PaginationEntityState>,
  ) {
    return pagination$.pipe(
      map(pagination => {
        return !!Object.values(pagination.pageRequests).find(pageRequest => pageRequest.busy);
      }),
      distinctUntilChanged(),
    );
  }
  // ### Initialization methods end.
}
