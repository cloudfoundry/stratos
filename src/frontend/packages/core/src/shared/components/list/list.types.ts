import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { IListDataSource, RowState } from './data-sources-controllers/list-data-source-types';

// @Component({})
export abstract class TableCellCustomComponent<T, C = any> {
  protected pDataSource: IListDataSource<T>;
  set dataSource(dataSource: IListDataSource<T>) {
    this.pDataSource = dataSource;
  }
  get dataSource(): IListDataSource<T> {
    return this.pDataSource;
  }

  protected pRow: T;
  get row(): T {
    return this.pRow;
  }
  set row(row: T) {
    this.pRow = row;
  }

  protected pEntityKey: string;
  set entityKey(entityKey: string) {
    this.pEntityKey = entityKey;
  }
  get entityKey(): string {
    return this.pEntityKey;
  }

  protected pConfig: C;
  set config(config: C) {
    this.pConfig = config;
  }
  get config(): C {
    return this.pConfig;
  }

  rowState: Observable<RowState>;
}

export abstract class CardCell<T> extends TableCellCustomComponent<T> {
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
