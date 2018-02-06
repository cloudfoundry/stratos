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

export class PaginationMonitor<T> {
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
        private paginationKey: string,
        private entityKey: string,
        private schema: schema.Entity
    ) {
        this.init(
            store,
            paginationKey,
            entityKey,
            schema
        );
    }

    /**
     * Is the current page ready?
     * @param pagination
     */
    private isPageReady(pagination: PaginationEntityState) {
        const currentPageRequestInfo = this.getCurrentPageRequestInfo(pagination);
        return !!pagination && !!pagination.ids[pagination.currentPage] && !currentPageRequestInfo.busy;
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
        return pagination.pageRequests[pagination.currentPage] || {
            busy: false,
            error: false,
            message: ''
        };
    }

    // ### Initialization methods.
    private init(
        store: Store<AppState>,
        paginationKey: string,
        entityKey: string,
        schema: schema.Entity
    ) {
        this.pagination$ = this.createPaginationObservable(
            store,
            entityKey,
            paginationKey
        );
        this.currentPage$ = this.createPageObservable(
            store,
            this.pagination$,
            schema
        );
        this.currentPageError$ = this.createErrorObservable(this.pagination$);
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
            this.store.select(selectEntities<T>(this.entityKey)),
        ).pipe(
            filter(([pagination, entities]) => this.isPageReady(pagination)),
            withLatestFrom(this.store.select(getAPIRequestDataState)),
            map(([[pagination, entities], allEntities]) => {
                const page = pagination.ids[pagination.currentPage] || [];
                return page.length ? denormalize(page, [schema], entities).filter(ent => !!ent) : null;
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
    // ### Initialization methods end.

}

