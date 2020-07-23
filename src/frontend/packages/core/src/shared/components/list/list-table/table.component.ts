import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { combineLatest as observableCombineLatest, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ITableListDataSource } from '../data-sources-controllers/list-data-source-types';
import { IListPaginationController } from '../data-sources-controllers/list-pagination-controller';
import { ListExpandedComponentType } from '../list.component.types';
import { ListSort } from './../../../../../../store/src/actions/list.actions';
import { TableCellActionsComponent } from './table-cell-actions/table-cell-actions.component';
import { TableCellExpanderComponent, TableCellExpanderConfig } from './table-cell-expander/table-cell-expander.component';
import { TableCellSelectComponent } from './table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from './table-header-select/table-header-select.component';
import { TableRowExpandedService } from './table-row/table-row-expanded-service';
import { ITableColumn } from './table.types';


const tableColumnSelect: ITableColumn<any> = {
  columnId: 'select',
  headerCellComponent: TableHeaderSelectComponent,
  cellComponent: TableCellSelectComponent,
  class: 'table-column-select',
  cellFlex: '0 0 60px'
};

const tableColumnExpander: ITableColumn<any> = {
  columnId: 'expander',
  headerCellComponent: TableCellExpanderComponent,
  cellComponent: TableCellExpanderComponent,
  cellFlex: '0 0 47px',
};

const tableColumnAction: ITableColumn<any> = {
  columnId: 'actions',
  headerCell: () => '',
  cellComponent: TableCellActionsComponent,
  class: 'app-table__cell--table-column-action',
  cellFlex: '0 0 75px'
};

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  providers: [
    TableRowExpandedService
  ]
})
export class TableComponent<T> implements OnInit, OnDestroy {

  private uberSub: Subscription;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  // See https://github.com/angular/angular-cli/issues/2034 for weird definition
  @Input() hideTable = false;
  @Input() addSelect = false;
  @Input() addActions = false;
  @Input() expandComponent: ListExpandedComponentType<T>;
  @Input() inExpandedRow = false;
  @Input() dataSource: ITableListDataSource<T>;
  @Input() paginationController = null as IListPaginationController<T>;
  @Input() columns: ITableColumn<T>[];
  public columnNames: string[];

  @Input() minRowHeight: string;
  @Input() prominentErrorBar: boolean = true;

  ngOnInit() {
    if (this.addSelect || this.expandComponent || this.addActions) {
      const newColumns = [...this.columns];
      if (this.addSelect) {
        newColumns.splice(0, 0, tableColumnSelect);
      }
      if (this.expandComponent) {
        newColumns.splice(0, 0, {
          ...tableColumnExpander,
          cellConfig: (row: T) => {
            const res: TableCellExpanderConfig = {
              rowId: this.dataSource.trackBy(null, row)
            };
            return res;
          }
        });
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
