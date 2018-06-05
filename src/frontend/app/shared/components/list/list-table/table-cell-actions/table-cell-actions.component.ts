
import {of as observableOf,  Observable ,  combineLatest } from 'rxjs';
import { Component, Input } from '@angular/core';
import { OnInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { Store } from '@ngrx/store';
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

  private _row: T;
  @Input('row')
  get row() { return this._row; }
  set row(row: T) {
    this._row = row;
    if (row) {
      this.initialise(row);
    }
  }

  private busy$: Observable<boolean>;
  private show$: Observable<boolean>;

  actions: IListAction<T>[];
  obs: {
    visible: { [action: string]: Observable<boolean> },
    enabled: { [action: string]: Observable<boolean> }
  };

  constructor(private store: Store<AppState>, public listConfig: ListConfig<T>) {
    super();
    this.actions = listConfig.getSingleActions();
  }

  ngOnInit() {
    this.busy$ = this.rowState.pipe(
      map(state => state.busy)
    );
  }

  initialise(row) {
    if (this.obs) {
      return;
    }
    this.obs = {
      visible: {},
      enabled: {}
    };
    this.actions.forEach(action => {
      this.obs.visible[action.label] = action.createVisible ? action.createVisible(row) : observableOf(true);
      this.obs.enabled[action.label] = action.createEnabled ? action.createEnabled(row) : observableOf(true);
    });

    this.show$ = combineLatest(Object.values(this.obs.visible)).pipe(
      map(visibles => visibles.some(visible => visible))
    );
  }
}
