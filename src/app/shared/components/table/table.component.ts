import {
  ListFilter,
  ListPagination,
  ListSort,
  SetListFilterAction,
  SetListPaginationAction,
  SetListSortAction,
} from '../../../store/actions/list.actions';
import { Component, ContentChild, EventEmitter, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { MatPaginator, MatSort, Sort, MatTable, PageEvent } from '@angular/material';
import { NgModel, NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { Subscription } from 'rxjs/Subscription';
import { IListDataSource } from '../../data-sources/list-data-source-types';
import { ITableColumn, ITableText } from './table.types';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T extends object> implements OnInit, OnDestroy {

  private uberSub: Subscription;

  @ViewChild(MatSort) sort: MatSort;


  // See https://github.com/angular/angular-cli/issues/2034 for weird definition
  @Input('dataSource') dataSource = null as IListDataSource<T>;
  @Input('columns') columns: ITableColumn<T>[];
  private columnNames: string[];

  @Input('text') text: ITableText;
  @Input('enableFilter') enableFilter = false;
  @Input('fixedRowHeight') fixedRowHeight = false;
  @Input('addForm') addForm: NgForm;
  public safeAddForm() {
    // Something strange is afoot. When using addform in [disabled] it thinks this is null, even when initialised
    // When applying the question mark (addForm?) it's value is ignored by [disabled]
    return this.addForm || {};
  }

  constructor(
    private _store: Store<AppState>,
  ) { }

  ngOnInit() {
    this.columnNames = this.columns.map(x => x.columnId);

    const sortStoreToWidget = this.dataSource.sort$.do((sort: ListSort) => {
      if (this.sort.active !== sort.field || this.sort.direction !== sort.direction) {
        this.sort.sort({
          id: sort.field,
          start: sort.direction as 'asc' | 'desc',
          disableClear: true
        });
      }
    });

    const sortWidgetToStore = this.sort.sortChange.do((sort: Sort) => {
      this._store.dispatch(new SetListSortAction(
        this.dataSource.listStateKey,
        {
          field: sort.active,
          direction: sort.direction,
        }
      ));
    });

    this.uberSub = Observable.combineLatest(
      sortStoreToWidget,
      sortWidgetToStore,
    ).subscribe();
  }

  ngOnDestroy() {
    this.uberSub.unsubscribe();
  }
}
