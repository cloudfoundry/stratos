import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppState } from '../../../../../../../store/src/app-state';
import { RowState } from '../../data-sources-controllers/list-data-source-types';
import { IListAction, ListConfig } from '../../list.component.types';
import { TableCellCustom } from '../../list.types';


@Component({
  selector: 'app-table-cell-actions',
  templateUrl: './table-cell-actions.component.html',
  styleUrls: ['./table-cell-actions.component.scss']
})
export class TableCellActionsComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input()
  rowState: Observable<RowState>;

  private pRow: T;
  @Input('row')
  get row() { return this.pRow; }
  set row(row: T) {
    this.pRow = row;
    if (row) {
      this.initialise(row);
    }
  }

  public busy$: Observable<boolean>;
  public show$: Observable<boolean>;

  actions: IListAction<T>[];
  obs: {
    visible: { [action: string]: Observable<boolean> },
    enabled: { [action: string]: Observable<boolean> }
  };

  private subjects: BehaviorSubject<T>[] = [];

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
      return this.updateActionButtons(row);
    }
    this.obs = {
      visible: {},
      enabled: {}
    };
    const subject = new BehaviorSubject(row);
    this.subjects.push(subject);

    this.actions.forEach(action => {
      this.obs.visible[action.label] = action.createVisible ? action.createVisible(subject) : observableOf(true);
      this.obs.enabled[action.label] = action.createEnabled ? action.createEnabled(subject) : observableOf(true);
    });

    this.show$ = combineLatest(Object.values(this.obs.visible)).pipe(
      map(visibles => visibles.some(visible => visible))
    );
  }

  private updateActionButtons(row: T) {
    if (this.subjects.length > 0) {
      this.subjects.forEach(subject => {
        subject.next(row);
      });
    }
  }
}
