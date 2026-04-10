import { ChangeDetectionStrategy, Component, computed, effect, inject, Injector, Input, OnInit, runInInjectionContext, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { RowState } from '../../data-sources-controllers/list-data-source-types';
import { TableCellCustom } from '../../list.types';

@Component({
  selector: 'app-table-cell-select',
  templateUrl: './table-cell-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class TableCellSelectComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input()
  declare rowState: Observable<RowState>;

  // Inject the Injector to use in ngOnInit for runInInjectionContext
  private readonly injector = inject(Injector);

  // Convert observables to signals for zoneless
  // Signal is created in ngOnInit after rowState input is available
  private rowStateSignal?: Signal<RowState | undefined>;

  // Use writable signals to store computed values, updated via effect
  protected disableSignal = signal<boolean | undefined>(undefined);
  protected tooltipSignal = signal<string | null>(null);

  // Computed signals that read from the writable signals
  disable = computed(() => this.disableSignal());
  tooltip = computed(() => this.tooltipSignal());

  ngOnInit(): void {
    // Use runInInjectionContext to create signal from observable
    if (this.rowState) {
      runInInjectionContext(this.injector, () => {
        this.rowStateSignal = toSignal(this.rowState);

        // Use effect to update writable signals when rowState changes
        effect(() => {
          const state = this.rowStateSignal?.();
          this.disableSignal.set(state?.disabled);
          this.tooltipSignal.set(state?.disabled ? state.disabledReason : null);
        });
      });
    }
  }
}
