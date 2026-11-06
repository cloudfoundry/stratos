import { Directive, input } from '@angular/core';
import { Observable } from 'rxjs';

import { RowState } from './row-state.types';

/**
 * Signal-list cell base classes. Custom cells rendered by `<app-signal-list>`
 * extend these. Unlike the legacy ngrx list framework's `TableCellCustom`,
 * these carry no `dataSource` (`IListDataSource`) coupling — signal cells read
 * only the `row` and `config` inputs and the `rowState` observable.
 */
@Directive()
export abstract class TableCellCustom<T, C = any> {
  // The row this cell shows, bound as [row]. Subclasses derive their state
  // from it with `computed`, so they follow a row that changes in place.
  readonly row = input.required<T>();

  // strict: backing field for `entityKey`, set by the host list before render
  protected pEntityKey!: string;
  set entityKey(entityKey: string) {
    this.pEntityKey = entityKey;
  }
  get entityKey(): string {
    return this.pEntityKey;
  }

  // Optional per-cell settings, bound as [config]. Undefined when the host
  // does not bind it.
  readonly config = input<C>();

  // strict: assigned by the host signal-list when the cell is instantiated
  rowState!: Observable<RowState>;
}

// Decorated so that card components inherit the `row` and `config` inputs
// through this class.
@Directive()
export abstract class CardCell<T> extends TableCellCustom<T> {
  static columns = 3;
}
