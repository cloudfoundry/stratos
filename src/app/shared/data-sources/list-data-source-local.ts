// import { ListFilter, ListPagination, ListSort } from '../../store/actions/list.actions';
// import { DataSource } from '@angular/cdk/table';
// import { Observable, Subscribable } from 'rxjs/Observable';
// import { Sort, MatPaginator, MatSort } from '@angular/material';
// import { BehaviorSubject } from 'rxjs/BehaviorSubject';
// import { Store } from '@ngrx/store';
// import { Subscription } from 'rxjs/Subscription';
// import { schema } from 'normalizr';
// import { ListDataSource } from './list-data-source';
// import { AppState } from '../../store/app-state';
// import { IListDataSource, getRowUniqueId } from './list-data-source-types';


// export abstract class LocalListDataSource<T> extends ListDataSource<T> implements IListDataSource<T> {

//   abstract filteredRows: Array<T>;
//   abstract isLoadingPage$: Observable<boolean>;
//   abstract data$: any;
//   private bsCount: BehaviorSubject<number> = new BehaviorSubject(0);
//   private _selectItemAfterPagination: T;

//   constructor(
//     private _dStore: Store<AppState>,
//     private _dGetRowUniqueId: getRowUniqueId,
//     _dEmptyType: () => T,
//     private _defaultSort: Sort,
//     private _dlistStateKey: string,
//   ) {
//     super(_dStore, _dGetRowUniqueId, _dEmptyType, _dlistStateKey);
//   }

//   connect(): Observable<T[]> {
//     if (!this.page$) {
//       this.page$ = this.data$
//         .combineLatest(
//         this.pagination$,
//         // this.sort$,
//         // this.filter$,
//       )
//         .map(([collection, pagination]: [Array<T>, ListPagination]) => {
//           // .map(([collection, pagination, sort, filter]: [Array<T>, ListPagination, ListSort, ListFilter]) => {
//           // if (pagination.totalResults !== collection.length) {
//           //   this._dStore.dispatch(new SetListPaginationAction(this.listStateKey, {
//           //     ...pagination,
//           //     totalResults: collection.length
//           //   }));
//           // }

//           // const filtered = this.listFilter(collection, filter);

//           // const sorted = this.listSort(filtered, sort);

//           // const page = this.paginate(sorted, pagination.pageSize, pagination.pageIndex);
//           const page = this.paginate(collection, pagination.pageSize, pagination.pageIndex);


//           return page;
//         });
//     }
//     return this.page$;
//   }

//   destroy() {
//     super.destroy();
//   }

//   abstract listFilter(collection: any, filter: ListFilter): Array<T>;
//   abstract listSort(collection: Array<T>, sort: ListSort): Array<T>;

//   saveAdd() {
//     this._selectItemAfterPagination = this.addItem;
//     super.saveAdd();
//   }

//   paginate(collection: Array<T>, pageSize: number, pageIndex: number): T[] {
//     // Is the paginators pageIndex valid?
//     if (pageIndex * pageSize > collection.length) {
//       pageIndex = Math.floor(collection.length / pageSize);
//     }

//     // Should the paginator select a freshly added row?
//     if (this._selectItemAfterPagination) {
//       for (let i = 0; i < collection.length; i++) {
//         if (this._dGetRowUniqueId(collection[i]) === this._dGetRowUniqueId(this._selectItemAfterPagination)) {
//           pageIndex = Math.floor(i / pageSize);
//           // this._dStore.dispatch(new SetListPaginationAction(this._dlistStateKey, {
//           //   pageIndex: pageIndex
//           // }));
//           delete this._selectItemAfterPagination;
//           break;
//         }
//       }
//     }
//     const startIndex: number = pageIndex * pageSize;
//     return collection.splice(startIndex, pageSize);
//   }

// }
