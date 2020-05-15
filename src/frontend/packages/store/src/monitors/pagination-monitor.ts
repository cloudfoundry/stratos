import { Store } from '@ngrx/store';
import { denormalize, schema as normalizrSchema } from 'normalizr';
import { asapScheduler, combineLatest, Observable, ReplaySubject } from 'rxjs';
import { tag } from 'rxjs-spy/operators';
import {
  combineLatest as combineLatestOperator,
  distinctUntilChanged,
  filter,
  map,
  multicast,
  observeOn,
  refCount,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';

import {
  LocalPaginationHelpers,
} from '../../../core/src/shared/components/list/data-sources-controllers/local-list.helpers';
import { AppState, GeneralEntityAppState, GeneralRequestDataState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from '../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import { EntitySchema } from '../helpers/entity-schema';
import { ActionState, ListActionState } from '../reducers/api-request-reducer/types';
import { getCurrentPageRequestInfo } from '../reducers/pagination-reducer/pagination-reducer.types';
import { getAPIRequestDataState, selectEntities } from '../selectors/api.selectors';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { PaginationEntityState } from '../types/pagination.types';

export class MultiActionListEntity {
  static getEntity(entity: MultiActionListEntity | any) {
    if (entity instanceof MultiActionListEntity) {
      return entity.entity;
    }
    return entity;
  }
  static getEntityKey(entity: MultiActionListEntity | any, defaultEntityKey: string = null) {
    if (entity instanceof MultiActionListEntity) {
      return entity.entityKey;
    }
    return defaultEntityKey;
  }
  constructor(public entity: any, public entityKey: string) { }
}
export class PaginationMonitor<T = any, Y extends AppState = GeneralEntityAppState> {

  /**
   * Emits the current page of entities.
   */
  public currentPage$: Observable<T[]>;
  public currentPageState$: Observable<ListActionState>;
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
  public isMultiAction$: Observable<boolean>;
  public schema: EntitySchema;

  /**
   * Returns a pagination monitor for a given catalog entity and pagination key.
   */
  static getMonitorFromCatalogEntity(
    store: Store<GeneralEntityAppState>,
    catalogEntity: StratosBaseCatalogEntity,
    paginationKey: string,
    {
      isLocal = false,
      schemaKey = ''
    }: any
  ) {
    // This is a static on the pagination monitor rather than a member of StratosBaseCatalogEntity due to
    // a circular dependency on entityFactory from the getPageInfo function below.
    const schema = catalogEntity.getSchema(schemaKey);
    return new PaginationMonitor(store, paginationKey, schema, isLocal);
  }


  constructor(
    private store: Store<Y>,
    public paginationKey: string,
    public entityConfig: EntityCatalogEntityConfig,
    public isLocal: boolean = false
  ) {
    const { endpointType, entityType, schemaKey } = entityConfig;
    const catalogEntity = entityCatalog.getEntity(endpointType, entityType);
    if (!catalogEntity) {
      throw new Error(`Could not find catalog entity for endpoint type '${endpointType}' and entity type '${entityType}'`);
    }
    this.schema = entityCatalog.getEntity(endpointType, entityType).getSchema(schemaKey);
    this.init(store, paginationKey, this.schema);
  }

  /**
   * Is the current page ready?
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
   */
  private getCurrentPageRequestInfo(
    pagination: PaginationEntityState,
  ): ActionState {
    return getCurrentPageRequestInfo(
      pagination,
      {
        busy: true,
        error: false,
        message: '',
      }
    );
  }

  // ### Initialization methods.
  private init(
    store: Store<GeneralEntityAppState>,
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
      const { entities$, isMultiAction$ } = this.createLocalPageObservable(this.pagination$, schema, this.fetchingCurrentPage$);
      this.currentPage$ = entities$;
      this.isMultiAction$ = isMultiAction$;
    } else {
      this.fetchingCurrentPage$ = this.createFetchingObservable(this.pagination$);
      this.currentPage$ = this.createPageObservable(this.pagination$, schema);
    }
    this.currentPageError$ = this.createErrorObservable(this.pagination$);
    this.currentPageState$ = this.pagination$.pipe(
      map(pagination => this.getCurrentPageRequestInfo(pagination))
    );
  }

  private createPaginationObservable(
    store: Store<GeneralEntityAppState>,
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
      .select(selectEntities<T>(schema.key))
      .pipe(distinctUntilChanged());
    const allEntitiesObservable$ = this.store.select(getAPIRequestDataState);
    return pagination$.pipe(
      // Improve efficiency
      observeOn(asapScheduler),
      filter(pagination => this.hasPage(pagination) && !LocalPaginationHelpers.isPaginationMaxed(pagination)),
      distinctUntilChanged(this.isPageSameIsh),
      combineLatestOperator(entityObservable$),
      withLatestFrom(allEntitiesObservable$),
      map(([[pagination], allEntities]) => {
        const { page, pageSchema } = this.getPageInfo(pagination, pagination.currentPage, schema);
        return this.denormalizePage(page, pageSchema, allEntities);
      }),
      tag('de-norming ' + schema.key),
      // See comment in createLocalPageObservable
      multicast(() => new ReplaySubject<any>(1)),
      refCount(),
    );
  }

  private getBaseEntityObservable(pagination$: Observable<PaginationEntityState>, schema: normalizrSchema.Entity) {
    return pagination$.pipe(
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
  }

  private createLocalPageObservable(
    pagination$: Observable<PaginationEntityState>,
    schema: normalizrSchema.Entity,
    fetching$: Observable<boolean>
  ) {

    const entityObservable$ = this.getBaseEntityObservable(
      pagination$,
      schema
    );


    const allEntitiesObservable$ = this.store.select(getAPIRequestDataState);

    const entities$ = pagination$.pipe(
      distinctUntilChanged(),
      // Improve efficiency
      observeOn(asapScheduler),
      filter(pagination => this.hasPage(pagination) && !LocalPaginationHelpers.isPaginationMaxed(pagination)),
      combineLatestOperator(entityObservable$),
      withLatestFrom(allEntitiesObservable$),
      map(([[pagination], allEntities]) => {
        return this.getLocalEntities(pagination, allEntities, schema).filter(ent => !!ent);
      }),
      tag('de-norming-local ' + schema.key),
    );

    const isMultiAction$ = combineLatest(
      pagination$,
      fetching$
    ).pipe(
      filter(([pagination, fetching]) => !fetching),
      map(([pagination]) => {
        return Object.values(pagination.pageRequests).reduce((entityKeys, pageRequest) => {
          const { entityConfig } = pageRequest;
          const key = entityCatalog.getEntityKey(entityConfig);
          if (key && !entityKeys.includes(key)) {
            entityKeys.push(key);
          }
          return entityKeys;
        }, []).length > 1;
      })
    );
    return {
      entities$: fetching$.pipe(
        filter(busy => !busy),
        switchMap(() => entities$),
        // Use this instead of publishReplay(1).
        // These are cached in the pagination monitor factory, so at times there are no subscribers. During this time changes in data occur.
        // With publishReplay(1) these changes are ignored and new subscribers will get the last entities emitted whilst there were
        // subscribers. The replacement line allows the obs to go `cold` when there are no subscribers but return to `hot` with the latest
        // data on new subscribers. For more info see
        // https://stackoverflow.com/questions/53798142/rxjs-unexpected-publishreplay-refcount-behaviour-after-refcount-goes-to-0
        // and https://stackoverflow.com/questions/42370097/how-to-force-publishreplay-to-resubscribe
        multicast(() => new ReplaySubject<any>(1)),
        // publishReplay(1),
        refCount(),
      ),
      isMultiAction$
    };
  }

  private getLocalEntities(pagination: PaginationEntityState, allEntities: GeneralRequestDataState, defaultSchema: normalizrSchema.Entity) {
    const pages = Object.keys(pagination.ids);
    if (pages.length > 1) {
      if (pagination.forcedLocalPage) {
        const { page, pageSchema } = this.getPageInfo(pagination, pagination.forcedLocalPage, defaultSchema);

        return this.denormalizePage(page, pageSchema, allEntities).map(entity => new MultiActionListEntity(entity, pageSchema.key));
      }
      return pages.reduce((allPageEntities, pageNumber) => {
        const { page, pageSchema } = this.getPageInfo(pagination, pageNumber, defaultSchema);
        return [
          ...allPageEntities,
          ...this.denormalizePage(page, pageSchema, allEntities).map(entity => new MultiActionListEntity(entity, pageSchema.key))
        ];
      }, []);
    } else {
      const page = pagination.ids[pagination.currentPage] || [];
      return page.length
        ? denormalize(page, [defaultSchema], allEntities)
        : [];
    }
  }

  private denormalizePage(page: string[], schema: normalizrSchema.Entity, allEntities: GeneralRequestDataState) {
    return page.length
      ? denormalize(page, [schema], allEntities).filter(ent => !!ent)
      : [];
  }

  private getPageInfo(pagination: PaginationEntityState, pageId: number | string, defaultSchema: normalizrSchema.Entity) {
    const page = pagination.ids[pageId] || [];
    const pageState = pagination.pageRequests[pageId] || {} as ListActionState;
    const pageSchema = pageState.entityConfig ? entityCatalog.getEntity(
      pageState.entityConfig.endpointType,
      pageState.entityConfig.entityType
    ).getSchema(pageState.entityConfig.schemaKey) : defaultSchema;
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
      observeOn(asapScheduler),
    );
  }
  // ### Initialization methods end.
}
