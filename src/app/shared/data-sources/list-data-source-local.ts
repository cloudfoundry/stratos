import { ListFilter, ListPagination, ListSort, SetListPaginationAction } from '../../store/actions/list.actions';
import { ObserveOnSubscriber } from 'rxjs/operator/observeOn';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MdPaginator, MdSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { schema } from 'normalizr';
import { ListDataSource, IListDataSource, getRowUniqueId } from './list-data-source';
import { AppState } from '../../store/app-state';


export abstract class LocalListDataSource<T extends object> extends ListDataSource<T> implements IListDataSource<T> {

  abstract filteredRows: Array<T>;
  abstract isLoadingPage$: Observable<boolean>;
  abstract data$: any;
  private bsCount: BehaviorSubject<number> = new BehaviorSubject(0);

  constructor(
    private _dStore: Store<AppState>,
    private _dGetRowUniqueId: getRowUniqueId,
    private _dEmptyType: T,
    private _defaultSort: Sort,
    private _dlistStateKey: string,
  ) {
    super(_dStore, _dGetRowUniqueId, _dEmptyType, _dlistStateKey);
  }

  connect(): Observable<T[]> {
    if (!this.page$) {
      this.page$ = this.data$
        .combineLatest(
        this.listPagination$,
        this.listSort$,
        this.listFilter$,
      )
        .map(([collection, pagination, sort, filter]: [Array<T>, ListPagination, ListSort, ListFilter]) => {
          // TODO: RC caching?? catch no-ops?
          if (pagination.totalResults !== collection.length) {
            this._dStore.dispatch(new SetListPaginationAction(this.listStateKey, {
              ...pagination,
              totalResults: collection.length
            }));
          }

          const filtered = this.listFilter(collection, filter);

          const sorted = this.listSort(filtered, sort);

          const page = this.paginate(sorted, pagination.pageSize, pagination.pageIndex);

          return page;
        });
    }
    return this.page$;
  }

  destroy() {
    super.destroy();
  }

  abstract listFilter(collection: any, filter: ListFilter): Array<T>;
  abstract listSort(collection: Array<T>, sort: ListSort): Array<T>;

  paginate(collection: Array<T>, pageSize: number, pageIndex: number): T[] {
    // Is the paginators pageIndex valid?
    if (pageIndex * pageSize > collection.length) {
      pageIndex = Math.floor(collection.length / pageSize);
    }

    // Should the paginator select a freshly added row?
    if (this.selectRow) {
      for (let i = 0; i < collection.length; i++) {
        if (this._dGetRowUniqueId(collection[i]) === this._dGetRowUniqueId(this.selectRow)) {
          pageIndex = Math.floor(i / pageSize);
          this._dStore.dispatch(new SetListPaginationAction(this._dlistStateKey, {
            pageIndex: pageIndex
          }));
          delete this.selectRow;
          break;
        }
      }
    }
    const startIndex: number = pageIndex * pageSize;
    return collection.splice(startIndex, pageSize);
  }

}
