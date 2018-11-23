import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSort, Sort } from '@angular/material';
import { combineLatest as observableCombineLatest, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ListSort } from '../../../../store/actions/list.actions';
import { ITableListDataSource } from '../data-sources-controllers/list-data-source-types';
import { IListPaginationController } from '../data-sources-controllers/list-pagination-controller';
import { TableCellActionsComponent } from './table-cell-actions/table-cell-actions.component';
import { TableCellSelectComponent } from './table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from './table-header-select/table-header-select.component';
import { ITableColumn } from './table.types';


const tableColumnSelect = {
  columnId: 'select',
  headerCellComponent: TableHeaderSelectComponent,
  cellComponent: TableCellSelectComponent,
  class: 'table-column-select',
  cellFlex: '0 0 60px'
};

const tableColumnAction = {
  columnId: 'actions',
  headerCell: () => '',
  cellComponent: TableCellActionsComponent,
  class: 'app-table__cell--table-column-action',
  cellFlex: '0 0 75px'
};

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T> implements OnInit, OnDestroy {

  private uberSub: Subscription;

  @ViewChild(MatSort) sort: MatSort;

  // See https://github.com/angular/angular-cli/issues/2034 for weird definition
  @Input() hideTable = false;
  @Input() addSelect = false;
  @Input() addActions = false;
  @Input() dataSource: ITableListDataSource<T>;
  @Input() paginationController = null as IListPaginationController<T>;
  @Input() columns: ITableColumn<T>[];
  public columnNames: string[];

  @Input() fixedRowHeight = false;

  ngOnInit() {
    if (this.addSelect || this.addActions) {
      const newColumns = [...this.columns];
      if (this.addSelect) {
        newColumns.splice(0, 0, tableColumnSelect);
      }
      if (this.addActions) {
        newColumns.push(tableColumnAction);
      }
      this.columns = newColumns;
    }

    this.columnNames = this.columns.map(x => x.columnId);
    if (this.paginationController) {
      this.initWidgetStore();
    }
  }

  initWidgetStore() {
    const sortStoreToWidget = this.paginationController.sort$.pipe(
      tap((sort: ListSort) => {
        if (this.sort.active !== sort.field || this.sort.direction !== sort.direction) {
          this.sort.sort({
            id: sort.field,
            start: sort.direction as 'asc' | 'desc',
            disableClear: true
          });
        }
      })
    );

    const sortWidgetToStore = this.sort.sortChange.pipe(
      tap((sort: Sort) => {
        this.paginationController.sort({
          field: sort.active,
          direction: sort.direction,
        });
      })
    );

    this.uberSub = observableCombineLatest(
      sortStoreToWidget,
      sortWidgetToStore,
    ).subscribe();
  }

  getRowState(row: T) {
    if (this.dataSource.getRowState) {
      return this.dataSource.getRowState(row);
    }
    return null;
  }

  ngOnDestroy() {
    if (this.uberSub) {
      this.uberSub.unsubscribe();
    }
  }
}
