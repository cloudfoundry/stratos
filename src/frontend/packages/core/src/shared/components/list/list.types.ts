import { Component, Directive } from '@angular/core';
import { Observable } from 'rxjs';

import { TableCellCustom as SignalTableCellCustom } from '../signal-list/cell-base';
import { IListDataSource } from './data-sources-controllers/list-data-source-types';

// Legacy-only extension of the signal-list cell base. The signal-native base
// (signal-list/cell-base) is ngrx-free; the dying ngrx list framework's own
// cells still read/write `.dataSource`, so this subclass re-adds it. Both this
// subclass and its `dataSource` coupling die with the `list/` framework (D).
@Directive()
export abstract class TableCellCustom<T, C = any> extends SignalTableCellCustom<T, C> {
  protected pDataSource: IListDataSource<T>;
  set dataSource(dataSource: IListDataSource<T>) {
    this.pDataSource = dataSource;
  }
  get dataSource(): IListDataSource<T> {
    return this.pDataSource;
  }
}

export abstract class CardCell<T> extends TableCellCustom<T> {
  static columns = 3;

  // public columns = CardCell.columns;
}

export interface IListRowCell {
  listData: {
    label: string,
    data$?: Observable<string>,
    component?: Component,
  }[];
}
