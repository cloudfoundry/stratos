import { ChangeDetectionStrategy, Component, computed, Input, OnInit, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RowState } from '../../data-sources-controllers/list-data-source-types';
import { TableCellCustom } from '../../list.types';

@Component({
  selector: 'app-table-cell-select',
  templateUrl: './table-cell-select.component.html',
  styleUrls: ['./table-cell-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class TableCellSelectComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input()
  declare rowState: Observable<RowState>;

  // Convert observables to signals for zoneless
  private rowStateSignal: Signal<RowState | undefined>;
  disable: Signal<boolean | undefined>;
  tooltip: Signal<string | null | undefined>;

  ngOnInit() {
    this.rowStateSignal = toSignal(this.rowState);
    this.disable = computed(() => this.rowStateSignal()?.disabled);
    this.tooltip = computed(() => {
      const state = this.rowStateSignal();
      return state?.disabled ? state.disabledReason : null;
    });
  }
}
