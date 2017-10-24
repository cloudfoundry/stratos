import { ObserveOnSubscriber } from 'rxjs/operator/observeOn';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MdPaginator, MdSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { schema } from 'normalizr';
import { TableDataSource } from './table-data-source';
import { AppState } from '../../store/app-state';


export abstract class StandardTableDataSource<T extends object> extends TableDataSource<T> {

  abstract filteredRows: Array<T>;
  abstract isLoadingPage$: Observable<boolean>;
  abstract data$: any;
  private bsCount: BehaviorSubject<number> = new BehaviorSubject(0);

  constructor(
    private _dMdPaginator: MdPaginator,
    private _dMdSort: MdSort,
    private _dFilter: Observable<string>,
    private _dStore: Store<AppState>,
    private _dTypeId: string,
    private _dEmptyType: T,
  ) {
    super(_dMdPaginator, _dMdSort, _dFilter, _dStore, _dTypeId, _dEmptyType);
  }

  connect(): Observable<T[]> {
    return this.data$
      .combineLatest(
      this.pageSize$.startWith(5),
      this.pageIndex$.startWith(0),
      this.sort$.startWith({ active: 'name', direction: 'asc' }), // TODO: RC make generic
      this.filter$.startWith('')
      )
      .map(([collection, pageSize, pageIndex, sort, filter]: [Array<T>, number, number, Sort, string]) => {
        // TODO: RC caching?? catch no-ops?
        this._dMdPaginator.length = collection.length;

        const filtered = this.filter(collection, filter);

        const sorted = this.sort(filtered, sort);

        const page = this.paginate(sorted, pageSize, pageIndex);

        // TODO: RC !!!!!! This is being called multiple times at start
        return page;
      });
  }

  disconnect() {
    super.disconnect();
  }

  abstract filter(collection: any, filter: string): Array<T>;
  abstract sort(collection: Array<T>, sort: Sort): Array<T>;
  abstract paginate(collection: Array<T>, pageSize: number, pageIndex: number): Array<T>;
}
