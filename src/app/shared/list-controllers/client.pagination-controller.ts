// TODO: RC REMOVE
// import { AddParams, SetPage } from '../../store/actions/pagination.actions';
// import { PageEvent, SortDirection } from '@angular/material';
// import { Store } from '@ngrx/store';
// import { Observable } from 'rxjs/Rx';

// import { ListPagination, ListSort } from '../../store/actions/list.actions';
// import { AppState } from '../../store/app-state';
// import { SetListFilterAction, ListFilter } from './../../store/actions/list.actions';
// import { IPaginationController, PaginationControllerConfig } from './base.pagination-controller';
// import { map, filter } from 'rxjs/operators';

// export class ClientPagination implements IPaginationController {
//   constructor(
//     private store: Store<AppState>,
//     public config: PaginationControllerConfig,
//     public isLocal = false
//   ) {
//     this.pagination$ = this.config.pagination$.map(pag => ({
//       totalResults: pag.totalResults,
//       pageSize: pag.params['results-per-page'] || 2,
//       pageIndex: pag.currentPage,
//     }));

//     this.sort$ = this.config.pagination$.map(pag => ({
//       direction: pag.params['order-direction'] as SortDirection,
//       field: pag.params['order-direction-field']
//     })).filter(x => !!x).distinctUntilChanged((x, y) => {
//       return x.direction === y.direction && x.field === y.field;
//     });

//     this.filter$ = this.config.pagination$.pipe(
//       map(pag => this.config.getFilterFromParams(pag)),
//       filter(x => !!x),
//       map(filterString => ({
//         filter: filterString
//       }))
//     );

//   }
//   pagination$: Observable<ListPagination>;
//   sort$: Observable<ListSort>;
//   filter$: Observable<ListFilter>;
//   page(pageEvent: PageEvent) {
//     this.store.dispatch(new SetPage(this.config.entityKey, this.config.paginationKey, pageEvent.pageIndex));
//   }
//   sort = (listSort: ListSort) => {
//     this.store.dispatch(new AddParams(this.config.entityKey, this.config.paginationKey, {
//       ['order-field']: listSort.field,
//       ['order-direction']: listSort.direction
//     }, this.isLocal));
//   }
//   filter = filterString => {
//     this.config.setFilterParam(this.store, this.config.entityKey, this.config.paginationKey, {
//       filter: filterString
//     }, this.isLocal);
//     // TODO: RC REMOVE THESE EVERYWHERE
//     // this.store.dispatch(new SetListFilterAction(
//     //   this.config.listStateKey,
//     //   {
//     //     filter: filterString
//     //   }
//     // ));
//   }
// }
