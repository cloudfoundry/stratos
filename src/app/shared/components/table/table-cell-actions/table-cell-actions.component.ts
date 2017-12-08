import { CardComponent } from '../../cards/card/card.component';
import { CardEventComponent } from '../../cards/custom-cards/card-app-event/card-app-event.component';
import { IListAction, ListConfig } from '../../list/list.component';
/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191/ */
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../table-cell/table-cell-custom';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';

@Component({
  selector: 'app-table-cell-actions',
  templateUrl: './table-cell-actions.component.html',
  styleUrls: ['./table-cell-actions.component.scss']
})
export class TableCellActionsComponent<T> extends TableCellCustom<T> {
  constructor(
    private store: Store<AppState>,
    public listConfig: ListConfig
  ) {
    super();
  }

  execute(listActionConfig: IListAction<T>, row: T) {
    listActionConfig.action(row);
  }
}
