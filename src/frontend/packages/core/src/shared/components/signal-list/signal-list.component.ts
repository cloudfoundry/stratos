import { Component, HostListener, Input, Signal, WritableSignal, ChangeDetectionStrategy, ContentChild, ElementRef, TemplateRef, ViewChild, signal, DestroyRef, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { UsageGaugeComponent } from '../usage-gauge/usage-gauge.component';

export type SignalListPillColor = 'success' | 'warning' | 'danger' | 'neutral';

// One line of a `kind: 'compound'` cell. `link` is optional — segments
// without a link render as plain text, so callers can safely emit
// placeholder strings ('—') while lookups resolve without making them
// click as dead anchors.
export interface SignalListCompoundSegment {
  readonly text: string;
  readonly link?: readonly (string | number)[];
}

// Binding for a `kind: 'favorite'` column. The consumer owns persistence
// (typically via UserFavoriteManager); SignalListComponent just reads
// membership in the signal and calls toggle on click. Keys are row keys
// per config.getRowKey so the component doesn't need a bespoke favorite
// id scheme.
export interface SignalListFavoriteBinding<T> {
  readonly keys: Signal<ReadonlySet<string>>;
  readonly toggle: (row: T) => void;
}

// Binding for a `kind: 'gauge'` column. Renders an `<app-usage-gauge>` per
// row showing a 0..1 fraction as a horizontal bar that turns yellow at
// `warningAt` and red at `errorAt`. Restores the legacy Memory/Disk/CPU
// gauges that the V2 instances list rendered via `<app-table-cell-usage>`
// — kept as text-only when slice-2 first migrated to the signal list, now
// reinstated as a first-class kind so other usage-style columns (autoscaler
// metrics, quota cells) can adopt the gauge without bespoke renderers.
// `value` returns 0..1; `valueText` is an optional override for the label
// (e.g. "14 / 128 MB" instead of the default percentage).
export interface SignalListGaugeBinding<T> {
  readonly value: (row: T) => number;
  readonly valueText?: (row: T) => string;
  readonly warningAt?: number;
  readonly errorAt?: number;
}

// Binding for a `kind: 'radio'` column. Single-row selection: the
// consumer owns the writable signal holding the selected row's key
// (per config.getRowKey) or null when nothing is selected. The list
// renders a radio input per row that reads/writes the signal directly,
// and offers an optional `isDisabled` predicate so rows that can't be
// picked (already-attached routes, archived items) render as a dimmed
// disabled radio. Mirrors the `favorite` slot's shape: column carries
// the binding, component handles the click + visual state.
export interface SignalListRadioBinding<T> {
  readonly selectedKey: WritableSignal<string | null>;
  readonly isDisabled?: (row: T) => boolean;
}

// One entry in a `kind: 'actions'` kebab menu. Callers return the set
// relevant to each row — items that don't apply (e.g. Stop on a stopped
// app) can either be elided from the array or emitted with `disabled:
// true`. Prefer eliding when the action simply has no meaning; keep
// disabled for temporarily-unavailable actions so the menu shape stays
// stable. `danger` applies destructive styling (red), useful for delete-
// style entries that should stand apart visually.
export interface SignalListRowAction<T> {
  readonly label: string;
  readonly icon?: string;
  readonly disabled?: boolean;
  readonly danger?: boolean;
  readonly invoke: (row: T) => void | Promise<void>;
}

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
  kind?: 'text' | 'link' | 'pill' | 'dot' | 'compound' | 'favorite' | 'actions' | 'radio' | 'gauge';
  // Required when kind === 'link'. Returns the router-link target array,
  // or null to render as plain text.
  link?: (row: T) => readonly (string | number)[] | null;
  // Optional for kind === 'pill' or 'dot'. Returns a color family. Default: neutral.
  pillColor?: (row: T) => SignalListPillColor;
  // Required when kind === 'compound'. Returns an ordered list of segments;
  // each segment renders on its own line within the cell. Segments with
  // `link` render as cyan router links, those without render as plain
  // text (useful when a referenced entity is still loading or lookup
  // failed). `render(row)` is still used for the filter/sort string — the
  // service's filter/sort extractors can delegate to it for parity with
  // the visual.
  compound?: (row: T) => readonly SignalListCompoundSegment[];
  // Optional for kind === 'compound'. When set and the segment count for
  // a row exceeds this value, only the first `maxVisible` segments render
  // and a clickable "…and N more" affordance appears below them. Click
  // expands the cell to show all segments (with a "…show fewer" indicator
  // at the bottom to collapse). Each (row, column) pair tracks its own
  // expanded state so unrelated compound columns on the same row can be
  // expanded independently. Unset = unlimited (current behavior;
  // high-cardinality cells like an admin user with thousands of role
  // grants will overflow and break visual row alignment — see
  // project_signallist_row_overflow.md).
  maxVisible?: number;
  // Optional for kind === 'compound'. Caller-supplied label for the
  // collapsed-state link, given the count of hidden segments. Defaults to
  // `…and N more`. Useful for domain-specific phrasing such as
  // `(n) => '…and ' + n + ' more spaces'`.
  collapsedLabel?: (hidden: number) => string;
  // Required when kind === 'favorite'. See SignalListFavoriteBinding.
  // In table view the column renders as its own narrow cell; in card
  // view the star attaches to the Name line so the card doesn't grow
  // an extra row just for the favorite icon.
  favorite?: SignalListFavoriteBinding<T>;
  // Required when kind === 'actions'. Returns the kebab-menu entries
  // for this row. The cell renders a `more_vert` button; clicking
  // opens a popover menu with the returned entries. At most one row's
  // menu is open at any time; clicking outside (or on another kebab)
  // dismisses. Card mode treats the kebab identically to the favorite
  // star and lifts it onto the Name row.
  actions?: (row: T) => readonly SignalListRowAction<T>[];
  // Required when kind === 'gauge'. See SignalListGaugeBinding. The cell
  // renders an `<app-usage-gauge>` showing the value as a horizontal bar
  // with optional warning/error color thresholds, plus a label (default:
  // value formatted as percentage). Restores the legacy V2-instances
  // Mem/Disk/CPU gauges that slice-2 lost when migrating to plain text.
  gauge?: SignalListGaugeBinding<T>;
  // Required when kind === 'radio'. See SignalListRadioBinding.
  // The cell renders a single radio input bound to the consumer's
  // selectedKey signal; clicking sets it to the row's key (or unsets
  // if already selected — radio behavior is single-select, so re-click
  // is a no-op). Disabled rows show a dimmed radio that doesn't react.
  radio?: SignalListRadioBinding<T>;
  // Optional CSS width value (e.g. '12rem', '20%'). When set, applied via a
  // <col> in the table's <colgroup>. Unset columns share remaining width
  // equally under the fixed table layout.
  widthHint?: string;
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

/**
 * Page-level action button rendered in the SignalList toolbar — the slot
 * that hosts affordances like "Invite User" / "Manage Users" / "Add Org".
 *
 * Wave-4 of the signal-list framework had this field excised after the
 * first migration round shipped placeholder snackbar handlers; re-added
 * with explicit semantics: this is for actions that operate on the LIST
 * as a whole (open a dialog, navigate to a stepper), not on individual
 * rows. Row-level actions still use the per-row `kind: 'actions'` column.
 */
export interface SignalListHeaderAction {
  /** Display label inside the button. */
  readonly label: string;
  /** Optional Material icon name rendered to the left of the label. */
  readonly icon?: string;
  /** Click handler. */
  readonly run: () => void;
  /** Optional reactive disabled state — e.g. permission-gated actions. */
  readonly disabled?: Signal<boolean>;
  /** Optional tooltip / aria title. */
  readonly title?: string;
  /** Optional `data-test` attribute for E2E selectors. */
  readonly dataTest?: string;
  /** When true, render with a primary/accent style (typically the page's
   *  default action). At most one primary per toolbar by convention. */
  readonly primary?: boolean;
}

export interface SignalListConfig<T> {
  readonly pagedItems: Signal<T[]>;
  readonly totalFilteredResults: Signal<number>;
  readonly totalPages: Signal<number>;
  readonly pageIndex: WritableSignal<number>;
  readonly pageSize: WritableSignal<number>;
  // Page-size options presented to the user. Accepts either a single array
  // (applies to both view modes) or a per-mode record so tables can default
  // to tighter rows (10/25/50/100) while card grids favor larger pages
  // (6/12/24/48/96). When the user toggles viewMode, the page size snaps
  // to the first option for the new mode to avoid showing a value that
  // isn't in the dropdown.
  readonly pageSizeOptions?: readonly number[] | { table: readonly number[]; card: readonly number[] };
  readonly isAnyLoading: Signal<boolean>;
  readonly errorsByCnsi: Signal<Map<string, unknown>>;
  readonly columns: SignalListColumn<T>[];
  readonly getRowKey: (row: T) => string;
  readonly emptyMessage?: string;
  // Shown instead of emptyMessage when totalFilteredResults === 0 AND a
  // filter is active (any dropdown selected or nameFilter non-empty). Lets
  // the UI distinguish "no apps here" from "your filters match nothing".
  readonly emptyFilterMessage?: string;
  readonly loadingMessage?: string;
  readonly nameFilter?: WritableSignal<string>;
  // Column keys (see SignalListColumn.key / header fallback) eligible for
  // the text-filter. When 2+ entries are provided AND filterField is
  // supplied, the toolbar renders a dropdown left of the text input that
  // picks WHICH column the filter compares against. 0-1 entries = no
  // selector (text filter keeps its current target — typically name).
  readonly filterColumns?: readonly string[];
  // When filterColumns has 2+ entries, this signal tracks the active
  // filter field key. Writes trigger re-filtering via whatever predicate
  // the caller has registered on the data source.
  readonly filterField?: WritableSignal<string>;
  readonly filterDropdowns?: SignalListDropdown[];
  readonly onRefresh?: () => void | Promise<void>;
  // Optional — when provided, the toolbar renders a "Clear" button that
  // invokes this callback. The button is disabled when no filter is active
  // (all dropdowns at their "All" value and nameFilter empty), so it surfaces
  // only when clicking it would actually change the view.
  readonly onClear?: () => void;
  // Optional — when provided, each card in card view renders a colored
  // strip at the top reflecting the row's state. Common use: map app.state
  // to a success/danger/neutral color so a quick glance over a wall of
  // cards surfaces problems.
  readonly cardAccentColor?: (row: T) => SignalListPillColor;
  // Optional — when provided, the toolbar shows a table/card view toggle
  // and the body renders either a table or a card grid. When absent,
  // the list is table-only.
  readonly viewMode?: WritableSignal<SignalListViewMode>;
  // Optional — when provided, sortable column headers and the
  // card-mode sort dropdown are wired to this signal. Columns are
  // sortable iff they declare a sortField.
  readonly sort?: WritableSignal<SignalListSort>;
  // Optional — when true, hide the pagination bar (page-size selector,
  // range counter, page nav buttons) when the list fits on a single page
  // (totalPages <= 1). Lets compact embedded lists (e.g. an attached-routes
  // panel inside a stepper) skip the paginator chrome until it actually has
  // a job to do. Default false preserves existing behavior.
  readonly hidePagerWhenSingle?: boolean;
  // Optional — page-level action buttons rendered in the toolbar between
  // the view toggle and the refresh button. Use for affordances that
  // operate on the list as a whole (Invite User / Manage Users / Create
  // Org) — not per-row actions, which still go via `kind: 'actions'`.
  readonly headerActions?: readonly SignalListHeaderAction[];
}

@Component({
  selector: 'app-signal-list',
  standalone: true,
  imports: [CommonModule, RouterModule, UsageGaugeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signal-list.component.html',
  host: { class: 'block h-full min-h-0' },
})
export class SignalListComponent<T> implements AfterViewInit {
  @Input({ required: true }) config!: SignalListConfig<T>;

  // Optional content-projected template for fully-custom card rendering.
  // When supplied AND viewMode is 'card', signal-list delegates the card
  // body to this template (passing each row as the implicit context),
  // bypassing the default column-based card layout. Toolbar, pagination,
  // empty/loading states, and overflow handling all stay in signal-list.
  // Used by the helm catalog tab to render <app-chart-item> per row.
  @ContentChild('cardTemplate', { read: TemplateRef })
  cardTemplate?: TemplateRef<{ $implicit: T }>;

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

  // Small colored circle rendered to the LEFT of the text for `kind: 'dot'`
  // columns. Used for status rendering that matches the legacy Stratos
  // app-wall ("● Deployed - Online", "● Incomplete", etc.).
  dotClasses(color: SignalListPillColor): string {
    switch (color) {
      case 'success': return 'inline-block h-2.5 w-2.5 rounded-full bg-green-500';
      case 'warning': return 'inline-block h-2.5 w-2.5 rounded-full bg-yellow-500';
      case 'danger':  return 'inline-block h-2.5 w-2.5 rounded-full bg-red-500';
      default:        return 'inline-block h-2.5 w-2.5 rounded-full bg-gray-400';
    }
  }

  // Color class for the accent strip at the TOP of a card in card view.
  // Returns a Tailwind bg-* class matching the pill palette.
  accentBarClass(color: SignalListPillColor): string {
    switch (color) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger':  return 'bg-red-500';
      default:        return 'bg-gray-400';
    }
  }

  colorFor(col: SignalListColumn<T>, row: T): SignalListPillColor {
    return col.pillColor ? col.pillColor(row) : 'neutral';
  }

  cardAccentFor(row: T): SignalListPillColor {
    return this.config.cardAccentColor ? this.config.cardAccentColor(row) : 'neutral';
  }

  pageSizeOptions(): readonly number[] {
    const opts = this.config.pageSizeOptions;
    if (!opts) return [5, 20, 50, 80];
    if ('table' in opts && 'card' in opts) {
      const mode = this.config.viewMode ? this.config.viewMode() : 'table';
      return mode === 'card' ? opts.card : opts.table;
    }
    return opts;
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
    // Snap pageSize to a valid option for the new mode when per-mode
    // options are configured. Otherwise the dropdown would display blank
    // and the "X of Y" range would reflect a size not in the picker.
    const opts = this.config.pageSizeOptions;
    if (opts && 'table' in opts && 'card' in opts) {
      const next = mode === 'card' ? opts.card : opts.table;
      if (next.length && !next.includes(this.config.pageSize())) {
        this.config.pageSize.set(next[0]);
        this.config.pageIndex.set(0);
      }
    }
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

  // Columns eligible for the text-filter dropdown. Returns columns whose
  // key (or header fallback) appears in config.filterColumns, preserving
  // the order the caller specified. Empty iff the caller didn't opt in or
  // listed keys that don't match any configured column.
  filterableColumns(): SignalListColumn<T>[] {
    const keys = this.config.filterColumns;
    if (!keys || keys.length === 0) return [];
    const byKey = new Map<string, SignalListColumn<T>>();
    for (const col of this.config.columns) byKey.set(this.columnKey(col), col);
    const out: SignalListColumn<T>[] = [];
    for (const k of keys) {
      const col = byKey.get(k);
      if (col) out.push(col);
    }
    return out;
  }

  showFilterFieldSelector(): boolean {
    return !!this.config.filterField && this.filterableColumns().length >= 2;
  }

  // Returns the first column configured as kind === 'favorite'; the
  // card-body uses this to attach the star to the Name row so the
  // favorite column doesn't render as a label:value detail line.
  favoriteColumn(): SignalListColumn<T> | null {
    return this.config.columns.find(c => c.kind === 'favorite' && !!c.favorite) ?? null;
  }

  // Returns the first column configured as kind === 'actions'; the
  // card-body uses this to attach the kebab to the Name row so the
  // column doesn't render as a label:value detail line.
  actionsColumn(): SignalListColumn<T> | null {
    return this.config.columns.find(c => c.kind === 'actions' && !!c.actions) ?? null;
  }

  // Resolves the row-level link target — used to make the whole card /
  // table row clickable, mirroring the "name" link. Picks the first
  // column declared as kind === 'link' and asks it for the row's target.
  // Returns null when no link column exists or the column returns null
  // for this row (lookup still pending, permission denied, etc.) — the
  // template then renders the row as non-clickable.
  rowLink(row: T): readonly (string | number)[] | null {
    const col = this.config.columns.find(c => c.kind === 'link' && !!c.link);
    return col?.link?.(row) ?? null;
  }

  // Row key whose kebab menu is currently open. null = no menu open.
  // Clicking a kebab sets this to the row's key; clicking it again or
  // anywhere outside an open menu clears it.
  readonly openActionsRowKey: WritableSignal<string | null> = signal(null);

  toggleRowActions(row: T, ev: Event): void {
    ev.stopPropagation();
    const key = this.config.getRowKey(row);
    this.openActionsRowKey.update(curr => (curr === key ? null : key));
  }

  invokeAction(act: SignalListRowAction<T>, row: T, ev: Event): void {
    ev.stopPropagation();
    if (act.disabled) return;
    this.openActionsRowKey.set(null);
    void act.invoke(row);
  }

  // Any click that bubbles up to the document and isn't inside an
  // open menu or on a kebab button closes the menu. Per-menu/kebab
  // handlers already stopPropagation so clicks on them never reach
  // here. Cheap enough to run always — no-op when no menu is open.
  @HostListener('document:click', ['$event'])
  onDocumentClickForActions(_ev: MouseEvent): void {
    if (this.openActionsRowKey() !== null) {
      this.openActionsRowKey.set(null);
    }
  }

  isFavorite(col: SignalListColumn<T>, row: T): boolean {
    return !!col.favorite && col.favorite.keys().has(this.config.getRowKey(row));
  }

  onToggleFavorite(col: SignalListColumn<T>, row: T, ev: Event): void {
    ev.stopPropagation();
    col.favorite?.toggle(row);
  }

  // Radio-select helpers -----------------------------------------------

  isRadioSelected(col: SignalListColumn<T>, row: T): boolean {
    return !!col.radio && col.radio.selectedKey() === this.config.getRowKey(row);
  }

  isRadioDisabled(col: SignalListColumn<T>, row: T): boolean {
    return !!col.radio?.isDisabled && col.radio.isDisabled(row);
  }

  onSelectRadio(col: SignalListColumn<T>, row: T, ev: Event): void {
    ev.stopPropagation();
    if (!col.radio || this.isRadioDisabled(col, row)) return;
    col.radio.selectedKey.set(this.config.getRowKey(row));
  }

  // Compound-cell overflow ---------------------------------------------

  // Set of `${rowKey}::${columnKey}` entries currently in the expanded
  // state. Keyed per (row, column) so two compound columns on the same
  // row (e.g. Org Roles + Space Roles on the cf users page) expand and
  // collapse independently — keying by row alone would surprise users
  // who clicked "…and N more spaces" and saw orgs expand too. Survives
  // re-renders because the signal lives on the component instance, but
  // resets when the user navigates away (component teardown).
  readonly expandedCompoundCells: WritableSignal<ReadonlySet<string>> = signal(new Set<string>());

  // Internal — composes the (row, column) key used by expandedCompoundCells.
  private compoundCellKey(col: SignalListColumn<T>, row: T): string {
    return `${this.config.getRowKey(row)}::${this.columnKey(col)}`;
  }

  // True when the compound cell for (row, col) should render every segment
  // — either because the user expanded it OR because the segment count
  // doesn't exceed the column's maxVisible cap (no overflow to hide).
  // Always true when col.maxVisible is unset.
  isCompoundExpanded(col: SignalListColumn<T>, row: T): boolean {
    return this.expandedCompoundCells().has(this.compoundCellKey(col, row));
  }

  // Click handler for "…and N more" / "…show fewer" indicators. Toggles
  // the (row, column) entry in the expanded set. stopPropagation so the
  // click doesn't bubble to row-level selection (and doesn't close any
  // open kebab menus, which is the document:click handler's job).
  toggleCompoundExpanded(col: SignalListColumn<T>, row: T, ev: Event): void {
    ev.stopPropagation();
    const key = this.compoundCellKey(col, row);
    this.expandedCompoundCells.update(curr => {
      const next = new Set(curr);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Returns the segments to render for the cell, respecting maxVisible
  // and the per-cell expanded state. When the cap applies and the cell
  // is collapsed, returns a slice of the first `maxVisible`; otherwise
  // returns the full list. Centralises the slicing so the template
  // doesn't have to call .compound(row) twice (filter then count).
  visibleCompoundSegments(col: SignalListColumn<T>, row: T): readonly SignalListCompoundSegment[] {
    const all = col.compound!(row);
    const cap = col.maxVisible;
    if (cap == null || all.length <= cap || this.isCompoundExpanded(col, row)) {
      return all;
    }
    return all.slice(0, cap);
  }

  // Number of segments hidden by the maxVisible cap when the cell is
  // collapsed. Returns 0 when the cell renders fully (either no cap, no
  // overflow, or expanded) — the template uses this as a guard to skip
  // the "…and N more" affordance when there's nothing to hide.
  hiddenCompoundCount(col: SignalListColumn<T>, row: T): number {
    const cap = col.maxVisible;
    if (cap == null) return 0;
    if (this.isCompoundExpanded(col, row)) return 0;
    const total = col.compound!(row).length;
    return total > cap ? total - cap : 0;
  }

  // Caller-supplied or default phrasing for the "…and N more" affordance.
  // Default uses the ellipsis-prefixed form so it reads as a continuation
  // of the visible segments rather than a standalone label.
  collapsedLabelFor(col: SignalListColumn<T>, hidden: number): string {
    if (col.collapsedLabel) return col.collapsedLabel(hidden);
    return `…and ${hidden} more`;
  }

  onFilterFieldChange(field: string): void {
    this.config.filterField?.set(field);
    this.config.pageIndex.set(0);
  }

  // Placeholder text for the text-filter input; tracks the active field
  // when the selector is shown so users see e.g. "Filter by CF/Org/Space".
  // Falls back to "Filter by Name" for the single-field case.
  filterPlaceholder(): string {
    if (!this.showFilterFieldSelector()) return 'Filter by Name';
    const key = this.config.filterField!();
    const col = this.config.columns.find(c => this.columnKey(c) === key);
    return `Filter by ${col?.header ?? 'Name'}`;
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

  hasActiveFilter(): boolean {
    for (const dd of this.config.filterDropdowns ?? []) {
      if (dd.selected() != null) return true;
    }
    if (this.config.nameFilter && this.config.nameFilter().length > 0) return true;
    return false;
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
