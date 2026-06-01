import { Directive, Input } from '@angular/core';
import { Observable } from 'rxjs';

import { RowState } from './row-state.types';

/**
 * Signal-list cell base classes. Custom cells rendered by `<app-signal-list>`
 * extend these. Unlike the legacy ngrx list framework's `TableCellCustom`,
 * these carry no `dataSource` (`IListDataSource`) coupling — signal cells read
 * only `@Input() row`, `@Input() config` and the `rowState` observable.
 */
@Directive()
export abstract class TableCellCustom<T, C = any> {
  protected pRow: T;
  @Input()
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
  @Input()
  set config(config: C) {
    this.pConfig = config;
  }
  get config(): C {
    return this.pConfig;
  }

  rowState: Observable<RowState>;
}

export abstract class CardCell<T> extends TableCellCustom<T> {
  static columns = 3;
}
