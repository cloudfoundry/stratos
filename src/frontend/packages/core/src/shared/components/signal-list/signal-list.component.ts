import { Component, Input, Signal, WritableSignal, ChangeDetectionStrategy, ElementRef, ViewChild, signal, DestroyRef, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type SignalListPillColor = 'success' | 'warning' | 'danger' | 'neutral';

export interface SignalListColumn<T> {
  header: string;
  render: (row: T) => string;
  // When set, this column is sortable. String = property name on T;
  // function = comparator key (e.g. computed values, lower-cased name).
  sortField?: keyof T | ((row: T) => unknown);
  // Stable identifier for this column; used as the sort.field value
  // when the column is sortable. Defaults to the header text.
  key?: string;
  // Presentation hint. Default is 'text'.
  kind?: 'text' | 'link' | 'pill';
  // Required when kind === 'link'. Returns the router-link target array,
  // or null to render as plain text.
  link?: (row: T) => readonly (string | number)[] | null;
  // Optional for kind === 'pill'. Returns a color family. Default: neutral.
  pillColor?: (row: T) => SignalListPillColor;
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
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signal-list.component.html',
  host: { class: 'block h-full min-h-0' },
})
export class SignalListComponent<T> implements AfterViewInit {
  @Input({ required: true }) config!: SignalListConfig<T>;

  @ViewChild('scrollBody', { static: false }) scrollBody?: ElementRef<HTMLElement>;

  protected readonly Math = Math;

  // True when there is MORE content below the current scroll position —
  // i.e. the body overflows AND the user hasn't scrolled to the bottom
  // yet. Used to gate the bottom scroll-fade indicator so it shows only
  // when scrolling would actually reveal more rows. Hides when the user
  // has reached the bottom of the list.
  readonly hasOverflow = signal(false);

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private onScroll = () => this.measureOverflow();

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.mutationObserver?.disconnect();
      this.scrollBody?.nativeElement.removeEventListener('scroll', this.onScroll);
    });
  }

  ngAfterViewInit(): void {
    const el = this.scrollBody?.nativeElement;
    if (!el) return;
    this.measureOverflow();

    // Viewport changes (window resize, container resize) shift clientHeight.
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measureOverflow());
      this.resizeObserver.observe(el);
    }

    // Data changes add/remove DOM nodes in the scroll body, shifting
    // scrollHeight without triggering ResizeObserver on the body itself.
    // A MutationObserver catches those.
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => this.measureOverflow());
      this.mutationObserver.observe(el, { childList: true, subtree: true });
    }

    // Scroll position also matters: the fade should disappear when the
    // user reaches the bottom of the list.
    el.addEventListener('scroll', this.onScroll, { passive: true });
  }

  private measureOverflow(): void {
    const el = this.scrollBody?.nativeElement;
    if (!el) {
      this.hasOverflow.set(false);
      return;
    }
    const overflowing = el.scrollHeight > el.clientHeight + 1;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    this.hasOverflow.set(overflowing && !atBottom);
  }

  trackByRow = (_: number, row: T) => this.config.getRowKey(row);

  pillClasses(color: SignalListPillColor): string {
    switch (color) {
      case 'success': return 'inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
      case 'warning': return 'inline-block px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200';
      case 'danger':  return 'inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
      default:        return 'inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  colorFor(col: SignalListColumn<T>, row: T): SignalListPillColor {
    return col.pillColor ? col.pillColor(row) : 'neutral';
  }

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
