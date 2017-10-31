import { ObserveOnSubscriber } from 'rxjs/operator/observeOn';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MdPaginator, MdSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { schema } from 'normalizr';
import { TableDataSource, ITableDataSource, getRowUniqueId } from './table-data-source';
import { AppState } from '../../store/app-state';


export abstract class StandardTableDataSource<T extends object> extends TableDataSource<T> implements ITableDataSource<T> {

  abstract filteredRows: Array<T>;
  abstract isLoadingPage$: Observable<boolean>;
  abstract data$: any;
  private bsCount: BehaviorSubject<number> = new BehaviorSubject(0);

  constructor(
    private _dStore: Store<AppState>,
    private _dGetRowUniqueId: getRowUniqueId,
    private _dEmptyType: T,
    private _defaultSort: Sort,
  ) {
    super(_dStore, _dGetRowUniqueId, _dEmptyType);
  }

  connect(): Observable<T[]> {
    return this.data$
      .combineLatest(
      this.pageSize$.startWith(5),
      this.pageIndex$.startWith(0),
      this.sort$.startWith(this._defaultSort),
      this.filter$.startWith('')
      )
      .map(([collection, pageSize, pageIndex, sort, filter]: [Array<T>, number, number, Sort, string]) => {
        // TODO: RC caching?? catch no-ops?
        this.mdPaginator.length = collection.length;

        const filtered = this.filter(collection, filter);

        const sorted = this.sort(filtered, sort);

        const page = this.paginate(sorted, pageSize, pageIndex);

        return page;
      });
  }

  disconnect() {
    super.disconnect();
  }

  abstract filter(collection: any, filter: string): Array<T>;
  abstract sort(collection: Array<T>, sort: Sort): Array<T>;

  paginate(collection: Array<T>, pageSize: number, pageIndex: number): T[] {
    let actualPageSize = this.mdPaginator.pageIndex || pageIndex;
    // Is the paginators pageIndex valid?
    if (actualPageSize * pageSize > collection.length) {
      actualPageSize = Math.floor(collection.length / pageSize);
    }

    // Should the paginator select a freshly added row?
    if (this.selectRow) {
      for (let i = 0; i < collection.length; i++) {
        if (this._dGetRowUniqueId(collection[i]) === this._dGetRowUniqueId(this.selectRow)) {
          actualPageSize = Math.floor(i / pageSize);
          this.mdPaginator.pageIndex = Math.floor(i / pageSize);
          delete this.selectRow;
          break;
        }
      }
    }
    const startIndex: number = actualPageSize * pageSize;
    return collection.splice(startIndex, pageSize);
  }

}
