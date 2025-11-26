import { CommonModule, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, type OnDestroy, type OnInit, ViewChild } from '@angular/core';
import { TailwindSortDirective, type TailwindSort } from '../../../services/tailwind-sort.service';
import type { ListSort } from '@stratosui/store';
import { combineLatest as observableCombineLatest, type Observable, type Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import type { ITableListDataSource, RowState } from '../data-sources-controllers/list-data-source-types';
import type { IListPaginationController } from '../data-sources-controllers/list-pagination-controller';
import type { ListExpandedComponentType } from '../list.component.types';
import { TableCellActionsComponent } from './table-cell-actions/table-cell-actions.component';
import { TableCellExpanderComponent, type TableCellExpanderConfig } from './table-cell-expander/table-cell-expander.component';
import { TableCellSelectComponent } from './table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from './table-header-select/table-header-select.component';
import { TableCellComponent } from './table-cell/table-cell.component';
import { TableRowComponent } from './table-row/table-row.component';
import { TableRowExpandedService } from './table-row/table-row-expanded-service';
import type { ITableColumn } from './table.types';

// Type aliases for compatibility
type MatSort = TailwindSortDirective;
type Sort = TailwindSort;

const tableColumnSelect: ITableColumn<unknown> = {
  columnId: 'select',
  headerCellComponent: TableHeaderSelectComponent,
  cellComponent: TableCellSelectComponent,
  class: 'table-column-select',
  cellFlex: '0 0 60px'
};

const tableColumnExpander: ITableColumn<unknown> = {
  columnId: 'expander',
  headerCellComponent: TableCellExpanderComponent,
  cellComponent: TableCellExpanderComponent,
  cellFlex: '0 0 47px',
};

const tableColumnAction: ITableColumn<unknown> = {
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TableRowExpandedService
  ],
  standalone: true,
  imports: [
    CommonModule,
    TableCellComponent,
    TableRowComponent
  ]
})
export class TableComponent<T> implements OnInit, OnDestroy {

  private uberSub: Subscription;

  @ViewChild(TailwindSortDirective, { static: true }) sort: MatSort;

  constructor(private cdr: ChangeDetectorRef) { }

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
  @Input() prominentErrorBar = true;

  ngOnInit() {
    if (this.addSelect || this.expandComponent || this.addActions) {
      const newColumns = [...this.columns];
      if (this.addSelect) {
        newColumns.splice(0, 0, tableColumnSelect as ITableColumn<T>);
      }
      if (this.expandComponent) {
        newColumns.splice(0, 0, {
          ...tableColumnExpander,
          cellConfig: (row: T) => {
            const res: TableCellExpanderConfig = {
              rowId: String(this.dataSource.trackBy(0, row))
            };
            return res;
          }
        } as ITableColumn<T>);
      }
      if (this.addActions) {
        newColumns.push(tableColumnAction as ITableColumn<T>);
      }
      this.columns = newColumns;
    }

    this.columnNames = this.columns.map(x => x.columnId);
    if (this.paginationController) {
      this.initWidgetStore();
    }
  }

  initWidgetStore() {
    // If sort directive is not available (not in template), skip initialization
    if (!this.sort) {
      return;
    }

    const sortStoreToWidget = this.paginationController.sort$.pipe(
      tap((sort: ListSort) => {
        const matSort = this.sort as MatSort;
        if (matSort.active !== sort.field || matSort.direction !== sort.direction) {
          matSort.sort({
            id: sort.field,
            start: sort.direction as 'asc' | 'desc',
            disableClear: true
          });
          this.cdr.markForCheck();
        }
      })
    );

    const sortWidgetToStore = this.sort.sortChange.pipe(
      tap((sort: Sort) => {
        this.paginationController.sort({
          field: sort.active,
          direction: sort.direction,
        });
        this.cdr.markForCheck();
      })
    );

    this.uberSub = observableCombineLatest(
      sortStoreToWidget,
      sortWidgetToStore,
    ).subscribe();
  }

  getRowState(row: T): Observable<RowState> | null {
    if (this.dataSource.getRowState) {
      return this.dataSource.getRowState(row);
    }
    return null;
  }

  handleSort(column: ITableColumn<T>): void {
    if (column.sort && this.sort) {
      this.sort.sort({
        id: column.columnId,
        start: this.sort.direction === 'asc' ? 'desc' : 'asc',
        disableClear: true
      });
    }
  }

  ngOnDestroy() {
    if (this.uberSub) {
      this.uberSub.unsubscribe();
    }
  }
}
