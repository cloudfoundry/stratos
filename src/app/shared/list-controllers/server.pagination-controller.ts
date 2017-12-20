import { AddParams, SetPage } from './../../store/actions/pagination.actions';
import { PageEvent } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { ListPagination, ListSort } from '../../store/actions/list.actions';
import { AppState } from './../../store/app-state';
import { IPaginationController, PaginationControllerConfig } from './base.pagination-controller';

export class ServerPagination implements IPaginationController {
    constructor(
        private store: Store<AppState>,
        public config: PaginationControllerConfig
    ) {
        this.pagination$ = config.pagination$;
    }
    pagination$: Observable<ListPagination>;
    filter: (filterString: string) => void;
    page(pageEvent: PageEvent) {
        this.store.dispatch(new SetPage(this.config.entityKey, this.config.paginationKey, pageEvent.pageIndex));
    }
    sort(listSort) {
        this.store.dispatch(new AddParams(this.config.entityKey, this.config.paginationKey, {
            ['order-field']: listSort.order,
            ['order-direction']: listSort.direction
        }));
    }
}
