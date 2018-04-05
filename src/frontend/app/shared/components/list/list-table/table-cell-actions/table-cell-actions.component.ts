import { Component, Input } from '@angular/core';
import { OnInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { AppState } from '../../../../../store/app-state';
import { RowState } from '../../data-sources-controllers/list-data-source-types';
import { IListAction, ListConfig } from '../../list.component.types';
import { TableCellCustom } from '../../list.types';

@Component({
  selector: 'app-table-cell-actions',
  templateUrl: './table-cell-actions.component.html',
  styleUrls: ['./table-cell-actions.component.scss']
})
export class TableCellActionsComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input('rowState')
  rowState: Observable<RowState>;

  private busy$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    public listConfig: ListConfig<T>
  ) {
    super();
  }

  ngOnInit() {
    this.busy$ = this.rowState.pipe(
      map(state => state.busy)
    );
  }

  execute(listActionConfig: IListAction<T>, row: T) {
    listActionConfig.action(row);
  }
}
