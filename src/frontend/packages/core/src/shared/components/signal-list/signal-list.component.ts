import { Component, Input, Signal, WritableSignal, ChangeDetectionStrategy, ElementRef, ViewChild, signal, afterRender, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SignalListColumn<T> {
  header: string;
  render: (row: T) => string;
}

export interface SignalListDropdownOption {
  label: string;
  value: string | null;
}

export interface SignalListDropdown {
  label: string;
  options: Signal<SignalListDropdownOption[]>;
  selected: WritableSignal<string | null>;
  disabled?: Signal<boolean>;
}

export type SignalListViewMode = 'table' | 'card';

export interface SignalListConfig<T> {
  readonly pagedItems: Signal<T[]>;
  readonly totalFilteredResults: Signal<number>;
  readonly totalPages: Signal<number>;
  readonly pageIndex: WritableSignal<number>;
  readonly pageSize: WritableSignal<number>;
  readonly pageSizeOptions?: readonly number[];
  readonly isAnyLoading: Signal<boolean>;
  readonly errorsByCnsi: Signal<Map<string, unknown>>;
  readonly columns: SignalListColumn<T>[];
  readonly getRowKey: (row: T) => string;
  readonly emptyMessage?: string;
  readonly loadingMessage?: string;
  readonly nameFilter?: WritableSignal<string>;
  readonly filterDropdowns?: SignalListDropdown[];
  readonly onRefresh?: () => void | Promise<void>;
  // Optional — when provided, the toolbar shows a table/card view toggle
  // and the body renders either a table or a card grid. When absent,
  // the list is table-only.
  readonly viewMode?: WritableSignal<SignalListViewMode>;
}

@Component({
  selector: 'app-signal-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signal-list.component.html',
  host: { class: 'block h-full min-h-0' },
})
export class SignalListComponent<T> {
  @Input({ required: true }) config!: SignalListConfig<T>;

  @ViewChild('scrollBody', { static: false }) scrollBody?: ElementRef<HTMLElement>;

  protected readonly Math = Math;

  // True when the scroll body's content exceeds its viewport height.
  // Used to gate the bottom scroll-fade indicator so it's only shown
  // when scrolling would actually reveal more rows.
  readonly hasOverflow = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    let ro: ResizeObserver | undefined;

    afterRender(() => {
      const el = this.scrollBody?.nativeElement;
      if (!el) {
        this.hasOverflow.set(false);
        return;
      }
      this.hasOverflow.set(el.scrollHeight > el.clientHeight + 1);

      // Attach a ResizeObserver the first time we see the element so
      // viewport resizes (no data change) also re-measure. afterRender
      // handles data-driven reflow; the observer handles pure layout.
      if (!ro && typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => {
          const node = this.scrollBody?.nativeElement;
          if (!node) return;
          this.hasOverflow.set(node.scrollHeight > node.clientHeight + 1);
        });
        ro.observe(el);
      }
    });

    destroyRef.onDestroy(() => ro?.disconnect());
  }

  trackByRow = (_: number, row: T) => this.config.getRowKey(row);

  pageSizeOptions(): readonly number[] {
    return this.config.pageSizeOptions ?? [5, 20, 50, 80];
  }

  rangeText(): string {
    const total = this.config.totalFilteredResults();
    if (total === 0) return '0 of 0';
    const size = this.config.pageSize();
    const start = this.config.pageIndex() * size + 1;
    const end = Math.min(start + size - 1, total);
    return `${start} – ${end} of ${total}`;
  }

  onPageSizeChange(value: string): void {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    this.config.pageSize.set(n);
    this.config.pageIndex.set(0);
  }

  setViewMode(mode: SignalListViewMode): void {
    this.config.viewMode?.set(mode);
  }

  onDropdownChange(dropdown: SignalListDropdown, value: string): void {
    // The <select> value is a string, but our model uses `null` for the
    // "All" option. The option with value=null renders as an empty string
    // attribute, so treat empty string as the null selection.
    dropdown.selected.set(value === '' ? null : value);
    // Reset to first page so filtered results don't land on an empty page.
    this.config.pageIndex.set(0);
  }
}
