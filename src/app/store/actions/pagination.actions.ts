import { Action } from '@ngrx/store';

export const CLEAR_PAGINATION = '[Pagination] Clear entity';

export class ClearPaginationOfType implements Action {
    constructor(public entityKey: string) {
    }
    type = CLEAR_PAGINATION;
}
