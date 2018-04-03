import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { distinctUntilChanged, filter, map, pairwise, publishReplay, refCount } from 'rxjs/operators';

import { getCurrentPageRequestInfo } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginationEntityState } from '../../../../store/types/pagination.types';
import { AppState } from './../../../../store/app-state';

export class LocalListController<T = any> {
    public page$: Observable<T[]>;
    constructor(private store: Store<AppState>, page$: Observable<T[]>, pagination$: Observable<PaginationEntityState>, dataFunctions) {
        const pagesObservable$ = this.buildPagesObservable(page$, pagination$, dataFunctions);
        const currentPageIndexObservable$ = this.buildCurrentPageIndexObservable(pagination$);
        this.page$ = this.buildCurrentPageObservable(pagesObservable$, currentPageIndexObservable$);
    }

    private buildPagesObservable(page$: Observable<T[]>, pagination$: Observable<PaginationEntityState>, dataFunctions) {
        const cleanPagination$ = pagination$.pipe(
            distinctUntilChanged((oldVal, newVal) => this.paginationHasChanged(oldVal, newVal))
        );
        const cleanPage$ = combineLatest(page$, pagination$).pipe(
            distinctUntilChanged((oldPage, newPage) => {
                console.log(oldPage[0].length === newPage[0].length)
                return oldPage[0].length === newPage[0].length
                    && (
                        // Re-evaluate pages once we've finished fetching
                        getCurrentPageRequestInfo(oldPage[1]).busy === getCurrentPageRequestInfo(newPage[1]).busy
                        && !getCurrentPageRequestInfo(newPage[1]).busy
                    );
            }),
            map(([page]) => page)
        );
        return combineLatest(
            cleanPagination$,
            cleanPage$,
        ).pipe(
            map(([paginationEntity, entities]) => {
                if (entities && !entities.length) {
                    return [];
                }

                if (dataFunctions && dataFunctions.length) {
                    entities = dataFunctions.reduce((value, fn) => {
                        return fn(value, paginationEntity);
                    }, entities);
                }

                const pages = this.splitClientPages(entities, paginationEntity.clientPagination.pageSize);
                return pages;
            }),
            publishReplay(1),
            refCount()
        );
    }

    private buildCurrentPageIndexObservable(pagination$: Observable<PaginationEntityState>) {
        return pagination$.pipe(
            map(pagination => pagination.clientPagination.currentPage - 1),
            distinctUntilChanged()
        );
    }

    private buildCurrentPageObservable(pages$: Observable<T[][]>, currentPageIndex$: Observable<number>) {
        return combineLatest(
            pages$,
            currentPageIndex$
        ).pipe(
            map(([pages, currentIndex]) => pages[currentIndex])
        );
    }

    private splitClientPages(entites: T[], pageSize: number): T[][] {
        console.log('splitting');
        console.log(entites.length);
        if (!entites || !entites.length) {
            return [];
        }
        if (entites.length <= pageSize) {
            return [entites];
        }
        const array = [...entites];
        const pages = [];

        for (let i = 0; i < array.length; i += pageSize) {
            pages.push(array.slice(i, i + pageSize));
        }
        return pages;
    }

    private getPaginationCompareString(paginationEntity: PaginationEntityState) {
        return `${Object.values(paginationEntity.clientPagination.filter.items).join('')}
        :${paginationEntity.clientPagination.pageSize}
        :${ paginationEntity.clientPagination.totalResults}
        :${paginationEntity.params['order-direction-field']}
        :${paginationEntity.params['order-direction']}
        :${paginationEntity.clientPagination.filter.string}
        :${Object.values(paginationEntity.clientPagination.filter.items)}`;
        // Some outlier cases actually fetch independently from this list (looking at you app variables)
    }

    private paginationHasChanged(oldPag: PaginationEntityState, newPag: PaginationEntityState) {
        const oldPagCompareString = this.getPaginationCompareString(oldPag);
        const newPagCompareString = this.getPaginationCompareString(newPag);
        const hasChanged = oldPagCompareString !== newPagCompareString;
        // console.log(oldPagCompareString, newPagCompareString);
        // console.log(`Has changed: ${hasChanged}`);
        return oldPagCompareString !== newPagCompareString;
    }
}
