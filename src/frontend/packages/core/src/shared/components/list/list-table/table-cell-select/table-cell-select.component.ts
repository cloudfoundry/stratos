import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RowState } from '../../data-sources-controllers/list-data-source-types';
import { TableCellCustom } from '../../list.types';


@Component({
  selector: 'app-table-cell-select',
  templateUrl: './table-cell-select.component.html',
  styleUrls: ['./table-cell-select.component.scss']
})
export class TableCellSelectComponent<T> extends TableCellCustom<T> implements OnInit {

  disable$: Observable<boolean>;
  tooltip$: Observable<string>;

  @Input()
  rowState: Observable<RowState>;

  ngOnInit() {
    this.disable$ = this.rowState.pipe(
      map(state => state.disabled)
    );
    this.tooltip$ = this.rowState.pipe(
      map(state => state.disabled ? state.disabledReason : null)
    );
  }
}
