import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { ListSort } from '@stratosui/store';
import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ITableListDataSource, RowState } from '../data-sources-controllers/list-data-source-types';
import { IListPaginationController } from '../data-sources-controllers/list-pagination-controller';
import { ListExpandedComponentType } from '../list.component.types';
import { TableCellActionsComponent } from './table-cell-actions/table-cell-actions.component';
import { TableCellExpanderComponent, TableCellExpanderConfig } from './table-cell-expander/table-cell-expander.component';
import { TableCellSelectComponent } from './table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from './table-header-select/table-header-select.component';
import { TableCellComponent } from './table-cell/table-cell.component';
import { TableRowComponent } from './table-row/table-row.component';
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
  private cdr = inject(ChangeDetectorRef);


  private uberSub: Subscription;
  private currentSort: { field: string; direction: string } = { field: '', direction: '' };

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
        newColumns.splice(0, 0, tableColumnSelect);
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
    // Sync sort state from store to local tracking
    this.uberSub = this.paginationController.sort$.pipe(
      tap((sort: ListSort) => {
        this.currentSort = { field: sort.field, direction: sort.direction };
        this.cdr.markForCheck();
      })
    ).subscribe();
  }

  getRowState(row: T): Observable<RowState> | null {
    if (this.dataSource.getRowState) {
      return this.dataSource.getRowState(row);
    }
    return null;
  }

  handleSort(column: ITableColumn<T>): void {
    if (!column.sort || !this.paginationController) {
      return;
    }
    // Toggle direction: asc → desc → asc
    const newDirection = this.currentSort.field === column.columnId && this.currentSort.direction === 'asc'
      ? 'desc' : 'asc';
    this.currentSort = { field: column.columnId, direction: newDirection };
    this.paginationController.sort({
      field: column.columnId,
      direction: newDirection,
    });
    this.cdr.markForCheck();
  }

  getSortDirection(columnId: string): string {
    return this.currentSort.field === columnId ? this.currentSort.direction : '';
  }

  ngOnDestroy() {
    if (this.uberSub) {
      this.uberSub.unsubscribe();
    }
  }
}
