import { IListPaginationController } from '../../data-sources/list-pagination-controller';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatSort, Sort, MatRow } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { ListSort } from '../../../store/actions/list.actions';
import { AppState } from '../../../store/app-state';
import { IListDataSource } from '../../data-sources/list-data-source-types';
import { ITableColumn, ITableText } from './table.types';
import { TableRowComponent, TableCellOutlet } from './table-row/table-row.component';
import { CdkCellOutlet } from '@angular/cdk/table';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  // providers: [
  //   { provide: CdkCellOutlet, useClass: TableCellOutlet }
  // ]
})
export class TableComponent<T extends object> implements OnInit, OnDestroy {

  private uberSub: Subscription;

  @ViewChild(MatSort) sort: MatSort;


  // See https://github.com/angular/angular-cli/issues/2034 for weird definition
  @Input('dataSource') dataSource = null as IListDataSource<T>;
  @Input('paginationController') paginationController = null as IListPaginationController<T>;
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

    const sortStoreToWidget = this.paginationController.sort$.do((sort: ListSort) => {
      if (this.sort.active !== sort.field || this.sort.direction !== sort.direction) {
        this.sort.sort({
          id: sort.field,
          start: sort.direction as 'asc' | 'desc',
          disableClear: true
        });
      }
    });

    const sortWidgetToStore = this.sort.sortChange.do((sort: Sort) => {
      this.paginationController.sort({
        field: sort.active,
        direction: sort.direction,
      });
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
