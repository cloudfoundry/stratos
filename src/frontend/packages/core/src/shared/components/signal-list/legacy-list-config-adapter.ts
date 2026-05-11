import { Injector, NgZone, Signal, WritableSignal, computed, runInInjectionContext, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import type { GeneralAppState, ListSort as LegacyListSort } from '@stratosui/store';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import {
  IListConfig,
  IListMultiFilterConfig,
} from '../list/list.component.types';
import { ListPaginationController } from '../list/data-sources-controllers/list-pagination-controller';
import type { ITableColumn } from '../list/list-table/table.types';
import {
  SignalListColumn,
  SignalListConfig,
  SignalListDropdown,
  SignalListDropdownOption,
  SignalListSort,
  SignalListViewMode,
} from './signal-list.component';
import {
  MaxedStateSignal,
  createMaxedStateSignal,
} from './maxed-state.signal';

// One-time warning bookkeeping — keyed by columnId so a config that
// reuses the same legacy column on multiple pages logs once globally.
// Tests can clear this between runs via `__resetAdapterWarningsForTest`.
const _columnComponentWarned = new Set<string>();

/** @internal — exported for tests only. */
export function __resetAdapterWarningsForTest(): void {
  _columnComponentWarned.clear();
}

// Sidecar object on the returned `SignalListConfig` carrying values
// not yet part of the canonical surface. Wave-β consumers can opt in
// by reading from `(config as AdaptedSignalListConfig<T>).legacy.*`,
// while pages that don't care continue to treat the result as a plain
// `SignalListConfig<T>`. Kept on the return value rather than as a
// separate parameter so the adapter remains a single-call ergonomic.
export interface AdaptedSignalListExtras<T> {
  // Maxed-state mirror — wave-β pages can render their own banner
  // ("Showing first N of X — load all") without subscribing to the
  // legacy data-source observables.
  readonly maxedState: MaxedStateSignal;
  // Calls `dataSource.refresh()` directly, exposed in case a caller
  // wants a "force refresh" action that bypasses the toolbar's
  // `onRefresh` slot (which the adapter wires to the same call).
  readonly refresh: () => void;
  // Calls `dataSource.destroy()` so consumers that mount/unmount the
  // adapter outside Angular's normal lifecycle (e.g. inside a stepper
  // dialog) can release the underlying pagination subscription. The
  // adapter does NOT auto-destroy because the legacy data source is
  // typically owned by a config provider with longer lifetime.
  readonly destroy: () => void;
}

export type AdaptedSignalListConfig<T> = SignalListConfig<T> & {
  readonly legacy: AdaptedSignalListExtras<T>;
};

export interface AdaptLegacyListConfigOptions {
  readonly injector: Injector;
  // Caller-supplied default view mode. The legacy `defaultView` is
  // 'table' | 'cards' (note the plural) — the adapter normalises to
  // the SignalListConfig idiom 'table' | 'card'. Override here if the
  // page wants to start in a specific mode regardless of the legacy
  // config's default.
  readonly defaultViewMode?: SignalListViewMode;
}

// Bridges a legacy `IListConfig<T>` into the signal-native
// `SignalListConfig<T>` shape so wave-β consumers can flip from
// `<app-list>` to `<app-signal-list>` without rewriting each page.
//
// The adapter ONLY honors fields the SignalListComponent currently
// consumes. Out-of-scope legacy features (single-row actions, global
// actions, multi-row actions, expand-component, custom cell components)
// are left unwired with a one-time warning so the page author knows the
// migration needs a follow-up. Wave-β plans should NOT block on this
// adapter exposing every legacy feature — pages that need actions or
// custom cell renderers should migrate to a hand-written
// SignalListConfig instead.
//
// Wiring summary:
//   * `dataSource.page$` → `pagedItems`
//   * `dataSource.pagination$` → `totalFilteredResults`, `totalPages`
//   * `dataSource.isLoadingPage$` → `isAnyLoading`
//   * `dataSource.maxedResults$` + `maxedStateStartAt$` → sidecar
//     `legacy.maxedState`
//   * `controller.page()`, `pageSize()`, `sort()`,
//     `filterByString()`, `multiFilter()` for writes
//   * `getColumns()` → `columns[]` (via mapLegacyColumn)
//   * `getMultiFiltersConfigs()` → `filterDropdowns[]`
//   * `dataSource.refresh()` → `onRefresh`
//   * Reset of nameFilter + multi-filter dropdowns + sort defaults →
//     `onClear`
export function adaptLegacyListConfig<T>(
  legacy: IListConfig<T>,
  opts: AdaptLegacyListConfigOptions,
): AdaptedSignalListConfig<T> {
  return runInInjectionContext(opts.injector, () => {
    const store = opts.injector.get(Store) as Store<GeneralAppState>;
    const ngZone = opts.injector.get(NgZone);
    const dataSource = legacy.getDataSource();
    const controller = new ListPaginationController<T>(store, dataSource, ngZone);

    // ----- Read signals derived from RxJS observables -----------------

    const pagedItems = toSignal(dataSource.page$, { initialValue: [] as T[] });
    const isAnyLoading = toSignal(dataSource.isLoadingPage$, { initialValue: false });

    const pagination = toSignal(controller.pagination$, {
      initialValue: { totalResults: 0, pageSize: 0, pageIndex: 0 },
    });
    const totalFilteredResults = computed(() => pagination().totalResults);
    const totalPages = computed(() => {
      const p = pagination();
      if (!p.pageSize) return 0;
      return Math.max(1, Math.ceil(p.totalResults / p.pageSize));
    });

    // ----- Writable signals that round-trip through the controller ---

    // Each writable signal updates an in-memory snapshot synchronously
    // (so the UI doesn't lag a frame waiting for the store) AND
    // dispatches via the controller. Backwards reads from the store
    // overwrite the snapshot via the toSignal effect so the two
    // converge.
    const pageSizeSnapshot = signal(pagination().pageSize || 0);
    const pageIndexSnapshot = signal(pagination().pageIndex ? pagination().pageIndex - 1 : 0);

    // Keep snapshots in sync with the source-of-truth pagination
    // observable so anything that bypasses the wrapper (programmatic
    // store dispatches, pagination resets) still updates the UI.
    runInInjectionContext(opts.injector, () => {
      // Use a derived computed here to avoid effect()'s injection
      // requirement — toSignal already established a reactive context
      // we can read from.
      const _sync = computed(() => {
        const p = pagination();
        const newSize = p.pageSize || 0;
        const newIdx = p.pageIndex ? p.pageIndex - 1 : 0;
        if (pageSizeSnapshot() !== newSize) pageSizeSnapshot.set(newSize);
        if (pageIndexSnapshot() !== newIdx) pageIndexSnapshot.set(newIdx);
        return p;
      });
      // Touch the computed once so it registers (a no-op read keeps
      // the dependency graph live without leaking a subscription).
      _sync();
    });

    const pageSize: WritableSignal<number> = wrapWritable(
      pageSizeSnapshot,
      v => controller.pageSize(v),
    );
    const pageIndex: WritableSignal<number> = wrapWritable(
      pageIndexSnapshot,
      v => controller.page(v),
    );

    // Sort: the controller speaks ListSort which uses '' for cleared.
    // SignalList speaks SignalListSort with required asc/desc. Keep an
    // independent snapshot so SignalList renders a consistent value
    // even when the legacy sort is empty.
    const sortObs = controller.sort$.pipe(
      map((s): SignalListSort => ({
        field: s.field ?? '',
        direction: s.direction === 'desc' ? 'desc' : 'asc',
      })),
      distinctUntilChanged((a, b) => a.field === b.field && a.direction === b.direction),
    );
    const sortSnapshot = signal<SignalListSort>(toSignal(sortObs, {
      initialValue: { field: '', direction: 'asc' as const },
    })());
    runInInjectionContext(opts.injector, () => {
      const sortFromObs = toSignal(sortObs, { initialValue: sortSnapshot() });
      const _sortSync = computed(() => {
        const s = sortFromObs();
        const cur = sortSnapshot();
        if (s.field !== cur.field || s.direction !== cur.direction) sortSnapshot.set(s);
        return s;
      });
      _sortSync();
    });
    const sort: WritableSignal<SignalListSort> = wrapWritable(
      sortSnapshot,
      v => controller.sort({ field: v.field, direction: v.direction } as LegacyListSort),
    );

    // ----- Errors-by-CNSI: legacy data source doesn't expose this in
    // a structured way; wave-β will eventually plumb it from native
    // signals. For now, expose an empty map so consumers can still bind.
    const errorsByCnsi = signal(new Map<string, unknown>()).asReadonly();

    // ----- nameFilter: bridge from controller.filter$ (reads the
    // current filter string) and writes via filterByString().
    const nameFilterFromObs = toSignal(
      controller.filter$.pipe(
        map(f => f?.string ?? ''),
        distinctUntilChanged(),
      ),
      { initialValue: '' },
    );
    const nameFilterSnapshot = signal(nameFilterFromObs());
    runInInjectionContext(opts.injector, () => {
      const _nameSync = computed(() => {
        const v = nameFilterFromObs();
        if (nameFilterSnapshot() !== v) nameFilterSnapshot.set(v);
        return v;
      });
      _nameSync();
    });
    const nameFilter: WritableSignal<string> = wrapWritable(
      nameFilterSnapshot,
      v => controller.filterByString(v),
    );

    // ----- Multi-filter dropdowns -----------------------------------

    const multiFilterConfigs = (legacy.getMultiFiltersConfigs?.() ?? []) as IListMultiFilterConfig[];
    const filterDropdowns: SignalListDropdown[] = multiFilterConfigs.map(cfg => buildDropdown(cfg, controller, opts.injector));

    // ----- Columns ---------------------------------------------------

    const columns = mapLegacyColumns(legacy.getColumns?.() ?? []);

    // ----- ViewMode --------------------------------------------------

    const initialView: SignalListViewMode = opts.defaultViewMode
      ?? (legacy.defaultView === 'cards' ? 'card' : 'table');
    const viewMode: WritableSignal<SignalListViewMode> = signal(initialView);

    // ----- Refresh / Clear -------------------------------------------

    const onRefresh = (): void => {
      dataSource.refresh();
    };
    const onClear = (): void => {
      controller.filterByString('');
      for (const dd of filterDropdowns) dd.selected.set(null);
      // Reset sort to whatever the data source's first sortable column
      // is — leave the snapshot intact so the toolbar keeps its
      // direction toggle. Callers with stricter "reset to default"
      // semantics should override this slot in their SignalListConfig.
    };

    // ----- Maxed-state mirror ---------------------------------------

    const maxedState = createMaxedStateSignal({
      pagination$: dataSource.pagination$,
      maxedStateStartAt$: dataSource.maxedStateStartAt$,
      onShowAll: () => dataSource.showAllAfterMax?.(),
      injector: opts.injector,
    });

    // ----- pageSizeOptions normalisation ----------------------------

    const pageSizeOptions = legacy.pageSizeOptions && legacy.pageSizeOptions.length > 0
      ? legacy.pageSizeOptions.filter(n => n > 0) // strip sentinels (PAGE_SIZE_ALL = -1)
      : undefined;

    const cfg: AdaptedSignalListConfig<T> = {
      pagedItems,
      totalFilteredResults,
      totalPages,
      pageIndex,
      pageSize,
      pageSizeOptions,
      isAnyLoading,
      errorsByCnsi,
      columns,
      getRowKey: (row: T) => dataSource.getRowUniqueId(row),
      emptyMessage: legacy.text?.noEntries,
      filterDropdowns: filterDropdowns.length > 0 ? filterDropdowns : undefined,
      onRefresh: legacy.hideRefresh ? undefined : onRefresh,
      onClear,
      viewMode,
      sort,
      nameFilter: legacy.enableTextFilter ? nameFilter : undefined,
      legacy: {
        maxedState,
        refresh: () => dataSource.refresh(),
        destroy: () => dataSource.destroy?.(),
      },
    };

    return cfg;
  });
}

// Map a legacy ITableColumn to a SignalListColumn. Returns null when
// the column needs a custom component renderer the adapter can't
// represent — caller drops it from the visible columns list and logs
// a one-time warning so the migration TODO surfaces in the console.
function mapLegacyColumn<T>(col: ITableColumn<T>): SignalListColumn<T> | null {
  // Custom cell components: the adapter has no way to project an
  // arbitrary Angular component into a SignalListColumn render path,
  // which is text/string-based.
  if (col.cellComponent && !col.cellDefinition) {
    if (!_columnComponentWarned.has(col.columnId)) {
      _columnComponentWarned.add(col.columnId);
      // eslint-disable-next-line no-console
      console.warn(
        `[adaptLegacyListConfig] column "${col.columnId}" uses cellComponent without cellDefinition; ` +
        `the signal-list adapter cannot render custom components — column dropped. ` +
        `Migrate to a hand-written SignalListConfig if this column is required.`,
      );
    }
    return null;
  }

  const def = col.cellDefinition;
  const header = col.headerCell ? safeHeader(col.headerCell) : col.columnId;

  // Render path priority: getValue (sync only — Observable variants
  // collapse to a placeholder) → valuePath dot lookup → empty string.
  const render = (row: T): string => {
    if (def?.getValue) {
      const v = def.getValue(row);
      // ICellDefinition.getValue can return Observable<string>; the
      // SignalList render path is sync. Render an em-dash placeholder
      // for those — the migration to a hand-written column should
      // resolve via toSignal at the consumer.
      if (v && typeof (v as { subscribe?: unknown }).subscribe === 'function') return '—';
      return v == null ? '' : String(v);
    }
    if (def?.valuePath) {
      const v = readByPath(row, def.valuePath);
      return v == null ? '' : String(v);
    }
    return '';
  };

  const out: SignalListColumn<T> = {
    header,
    render,
    key: col.columnId,
  };

  // Sortable iff the legacy column declared a sort. The adapter
  // doesn't (yet) honor custom sort comparators — the SignalList sorts
  // via the snapshot the controller dispatches against, not via a
  // local comparator, so any field-name sort works while custom
  // function sorts get downgraded to "sort by columnId field".
  if (col.sort) {
    out.sortField = col.columnId as keyof T;
  }

  // Link path: when the legacy definition has getLink, render as 'link'.
  if (def?.getLink) {
    out.kind = 'link';
    out.link = (row: T) => {
      const href = def.getLink!(row);
      // SignalListColumn.link returns a router-link array; legacy
      // returns a string path. Coerce by splitting on '/'.
      if (!href) return null;
      return href.startsWith('/') ? href.slice(1).split('/') : href.split('/');
    };
  }

  return out;
}

function mapLegacyColumns<T>(cols: ITableColumn<T>[]): SignalListColumn<T>[] {
  const out: SignalListColumn<T>[] = [];
  for (const c of cols) {
    const mapped = mapLegacyColumn(c);
    if (mapped) out.push(mapped);
  }
  return out;
}

function safeHeader(fn: () => string): string {
  try {
    const v = fn();
    return v == null ? '' : String(v);
  } catch {
    return '';
  }
}

function readByPath(row: unknown, path: string): unknown {
  if (row == null) return undefined;
  const parts = path.split('.');
  let cur: unknown = row;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function buildDropdown(
  cfg: IListMultiFilterConfig,
  controller: ListPaginationController<unknown>,
  injector: Injector,
): SignalListDropdown {
  return runInInjectionContext(injector, () => {
    const options = toSignal(
      cfg.list$.pipe(
        map(items => {
          const opts: SignalListDropdownOption[] = [];
          if (!cfg.hideAllOption) {
            opts.push({ label: cfg.allLabel ?? 'All', value: null });
          }
          for (const it of items ?? []) opts.push({ label: it.label, value: it.value });
          return opts;
        }),
      ),
      { initialValue: [] as SignalListDropdownOption[] },
    );
    const disabled = toSignal(cfg.loading$, { initialValue: false });

    const selected = signal<string | null>(null);
    // Wrap selected so writes propagate to the legacy controller
    // (which dispatches the multi-filter change through its bufferTime
    // pipe) AND to the IListMultiFilterConfig.select stream so any
    // remaining legacy consumers stay in sync.
    const wrapped: WritableSignal<string | null> = wrapWritable(selected, v => {
      controller.multiFilter(cfg, v ?? '');
      const sel = cfg.select as { next?: (value: unknown) => void };
      if (sel && typeof sel.next === 'function') sel.next(v ?? '');
    });

    return {
      label: cfg.label,
      options,
      selected: wrapped,
      disabled,
    };
  });
}

// Wraps a backing signal so writes go to a side-effect AND update the
// snapshot synchronously. Reads stay reactive against the backing
// signal so any external updates (toSignal effect, programmatic
// dispatch) flow through.
function wrapWritable<T>(backing: WritableSignal<T>, sideEffect: (v: T) => void): WritableSignal<T> {
  const callable = (() => backing()) as WritableSignal<T>;
  callable.set = (v: T): void => {
    backing.set(v);
    sideEffect(v);
  };
  callable.update = (fn: (cur: T) => T): void => {
    callable.set(fn(backing()));
  };
  callable.asReadonly = () => backing.asReadonly();
  return callable;
}

/**
 * Re-export of the legacy `IListConfig` for convenience so callers
 * importing the adapter don't need a second import path. Keep at the
 * bottom — top-level re-exports tend to drift when the shape changes.
 */
export type { IListConfig } from '../list/list.component.types';
