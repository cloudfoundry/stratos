import { Component, Input, Signal, WritableSignal, ChangeDetectionStrategy, ElementRef, ViewChild, signal, afterRender, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SignalListColumn<T> {
  header: string;
  render: (row: T) => string;
  // When set, this column is sortable. String = property name on T;
  // function = comparator key (e.g. computed values, lower-cased name).
  sortField?: keyof T | ((row: T) => unknown);
  // Stable identifier for this column; used as the sort.field value
  // when the column is sortable. Defaults to the header text.
  key?: string;
}

export interface SignalListSort {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
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
  // Optional — when provided, sortable column headers and the
  // card-mode sort dropdown are wired to this signal. Columns are
  // sortable iff they declare a sortField.
  readonly sort?: WritableSignal<SignalListSort>;
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

  // Sort support ---------------------------------------------------------

  columnKey(col: SignalListColumn<T>): string {
    return col.key ?? col.header;
  }

  isSortable(col: SignalListColumn<T>): boolean {
    return !!this.config.sort && col.sortField != null;
  }

  isSortedBy(col: SignalListColumn<T>): boolean {
    return !!this.config.sort && this.config.sort()!.field === this.columnKey(col);
  }

  sortDirectionFor(col: SignalListColumn<T>): 'asc' | 'desc' | null {
    if (!this.isSortedBy(col)) return null;
    return this.config.sort!().direction;
  }

  onHeaderSort(col: SignalListColumn<T>): void {
    if (!this.isSortable(col) || !this.config.sort) return;
    const key = this.columnKey(col);
    const current = this.config.sort();
    const nextDirection: 'asc' | 'desc' =
      current.field === key && current.direction === 'asc' ? 'desc' : 'asc';
    this.config.sort.set({ field: key, direction: nextDirection });
    this.config.pageIndex.set(0);
  }

  sortableColumns(): SignalListColumn<T>[] {
    return this.config.columns.filter(c => c.sortField != null);
  }

  onSortFieldChange(field: string): void {
    if (!this.config.sort) return;
    const current = this.config.sort();
    this.config.sort.set({ field, direction: current.direction });
    this.config.pageIndex.set(0);
  }

  toggleSortDirection(): void {
    if (!this.config.sort) return;
    const current = this.config.sort();
    this.config.sort.set({
      field: current.field,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    });
    this.config.pageIndex.set(0);
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
