/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191/ */
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../table-cell/table-cell-custom';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ListActionConfig } from '../../../data-sources/list=data-source-types';

@Component({
  selector: 'app-table-cell-actions',
  templateUrl: './table-cell-actions.component.html',
  styleUrls: ['./table-cell-actions.component.scss']
})
export class TableCellActionsComponent<T> extends TableCellCustom<T> {

  constructor(private store: Store<AppState>) {
    super();
  }

  execute(action: ListActionConfig<T>, row: T) {
    this.store.dispatch(action.createAction(this.dataSource, { x: row }));
  }
}
