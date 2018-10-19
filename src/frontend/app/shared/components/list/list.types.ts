import { IListDataSource, RowState } from './data-sources-controllers/list-data-source-types';
import { Observable } from 'rxjs';
import { Component } from '@angular/core';
import { AppStat } from '../../../store/types/app-metadata.types';

export abstract class TableCellCustom<T> {
  dataSource: IListDataSource<T>;
  row: T;
  config: any;
  rowState: Observable<RowState>;
}

export abstract class CardCell<T> extends TableCellCustom<T> {
  static columns = 3;
}

export interface IListRowCell {
  listData: {
    label: string,
    data$?: Observable<string>
    component?: Component
  }[];
}

export interface IListRowCellData {
  label: string;
  data$?: Observable<string>;
  component?: Component;
}
