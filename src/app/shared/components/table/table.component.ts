import {
  ListFilter,
  ListPagination,
  ListSort,
  SetListFilterAction,
  SetListPaginationAction,
  SetListSortAction,
  SetListStateAction,
} from '../../../store/actions/list.actions';
import { Component, ContentChild, EventEmitter, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { MdPaginator, MdSort, Sort, MdTable, PageEvent } from '@angular/material';
import { NgModel, NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { Subscription } from 'rxjs/Subscription';
import { IListDataSource } from '../../data-sources/list-data-source';

export interface ITableColumn<T> {
  columnId: string;
  cell?: (row: T) => string; // Either cell OR cellComponent should be defined
  cellComponent?: any;
  headerCell?: () => string; // Either headerCell OR headerCellComponent should be defined
  headerCellComponent?: any;
  class?: string;
  sort?: boolean;
  cellFlex?: string;
}

export interface ITableText {
  title: string;
  filter?: string;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T extends object> implements OnInit, OnDestroy {

  private uberSub: Subscription;

  // @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;


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

    const sortStoreToWidget = this.dataSource.listSort$.do((sort: ListSort) => {
      // || this.sort.disableClear !== sort.disableClear
      if (this.sort.active !== sort.field || this.sort.direction !== sort.direction) {
        this.sort.sort({
          id: sort.field,
          start: sort.direction as 'asc' | 'desc',
          disableClear: true
        });
        // this.sort.mdSortChange.emit({
        //   active: sort.field,
        //   direction: sort.direction
        // });
      }

      // this.sort.active = sort.field;
      // this.sort.direction = sort.direction;
      // this.sort.disableClear = sort.disableClear;
    });

    const sortWidgetToStore = this.sort.mdSortChange.do((sort: Sort) => {
      this._store.dispatch(new SetListSortAction(
        this.dataSource.listStateKey,
        {
          field: sort.active,
          direction: sort.direction,
        }
      ));
    });

    // const filterStoreToWidget = this.dataSource.listFilter$.do((filter: ListFilter) => {
    //   this.filter.model = filter.filter;
    // });

    // const filterWidgeToStore = this.filter.valueChanges
    //   .debounceTime(150)
    //   .distinctUntilChanged()
    //   .map(value => value as string)
    //   .do((stFilter: string) => {
    //     this._store.dispatch(new SetListFilterAction(
    //       this.dataSource.listStateKey,
    //       {
    //         filter: stFilter
    //       }
    //     ));
    //   });

    this.uberSub = Observable.combineLatest(
      sortStoreToWidget,
      sortWidgetToStore,
      // filterStoreToWidget,
      // filterWidgeToStore
    ).subscribe();
  }

  ngOnDestroy() {
    this.uberSub.unsubscribe();
  }
}
