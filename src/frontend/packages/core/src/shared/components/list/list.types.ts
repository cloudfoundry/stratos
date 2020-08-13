import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { IListDataSource, RowState } from './data-sources-controllers/list-data-source-types';

export abstract class TableCellCustom<T> {
  dataSource: IListDataSource<T>;
  row: T;
  entityKey: string;
  config: any;
  rowState: Observable<RowState>;
}

export abstract class CardCell<T> extends TableCellCustom<T> {
  static columns = 3;
  // public columns = CardCell.columns;
}

export interface IListRowCell {
  listData: {
    label: string,
    data$?: Observable<string>
    component?: Component
  }[];
}
