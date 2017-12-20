import { Observable } from 'rxjs/Observable';
import { PageEvent } from '@angular/material';

import { ListPagination, ListSort } from './../../store/actions/list.actions';

export class PaginationControllerConfig {
    constructor(
        public listStateKey: string,
        public pagination$: Observable<ListPagination>,
        public paginationKey: string,
        public entityKey: string
    ) { }
}

export interface IPaginationController {
    pagination$: Observable<ListPagination>;
    filter: (filterString: string) => void;
    sort: (listSort: ListSort) => void;
    page: (pageEvent: PageEvent) => void;
    config: PaginationControllerConfig;
}
