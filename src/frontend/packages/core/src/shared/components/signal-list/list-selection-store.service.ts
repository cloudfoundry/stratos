import { Injectable, Signal, WritableSignal, computed, signal } from '@angular/core';

// Mirrors the legacy `ListDataSource.selectedRows`/`isSelecting`/
// `selectAllChecked` triad as plain signals. Non-persisted by design —
// selection state is per-screen-mount, not per-list-type. (Persisting
// a selection across navigations would surprise users who returned to
// find unrelated rows pre-checked.)
//
// Keying: callers supply a `getKey: (row: T) => string` extractor so
// the store doesn't need to know the row shape. Same extractor used by
// SignalListConfig.getRowKey, so callers can pass that signal in
// directly — the store never compares rows by reference, which makes
// it stable across data-source refreshes that produce new object
// identities.
//
// Methods kept narrow: toggle (one row), selectAll (a set of rows),
// clear. The legacy `selectAllFilteredRows()` collapses cleanly to
// `selectAll(filteredRows, getKey)` at the call site, so we don't
// surface a separate method here.
//
// Why not `providedIn: 'root'`? A list-selection store is naturally
// scoped to the page that owns the list — making it root-singleton
// would force every list to share one map. Provide via the consuming
// component (or its parent route) so each list gets its own.

export interface BoundListSelectionState<T> {
  // Map of rowKey → row reference. WritableSignal so consumers can
  // observe and react (e.g. a multi-action toolbar that gates buttons
  // on `selectedRows().size > 0`).
  readonly selectedRows: WritableSignal<Map<string, T>>;
  // True iff any rows are selected. Convenience derived signal so the
  // toolbar doesn't have to recompute `.size > 0` on every read.
  readonly isSelecting: Signal<boolean>;
  // True iff every row in the supplied "all rows" set is currently
  // selected. Used by the header checkbox's "indeterminate vs
  // checked" state. Caller passes the current page (or filtered
  // rows) in as `allRows` — the store doesn't know what "all" means.
  readonly isAllSelected: (allRows: readonly T[]) => boolean;
  readonly toggle: (row: T) => void;
  readonly selectAll: (rows: readonly T[]) => void;
  readonly clear: () => void;
}

@Injectable()
export class ListSelectionStore<T> {
  bind(getKey: (row: T) => string): BoundListSelectionState<T> {
    const selectedRows = signal<Map<string, T>>(new Map<string, T>());
    const isSelecting = computed(() => selectedRows().size > 0);

    const toggle = (row: T): void => {
      const key = getKey(row);
      selectedRows.update(curr => {
        const next = new Map(curr);
        if (next.has(key)) next.delete(key);
        else next.set(key, row);
        return next;
      });
    };

    const selectAll = (rows: readonly T[]): void => {
      // Replace-mode rather than additive: matches the legacy
      // "select all visible" behavior. Calling clear() afterwards is
      // the correct way to invert the selection.
      const next = new Map<string, T>();
      for (const r of rows) next.set(getKey(r), r);
      selectedRows.set(next);
    };

    const clear = (): void => {
      selectedRows.set(new Map<string, T>());
    };

    const isAllSelected = (allRows: readonly T[]): boolean => {
      const sel = selectedRows();
      if (allRows.length === 0 || sel.size === 0) return false;
      for (const r of allRows) {
        if (!sel.has(getKey(r))) return false;
      }
      return true;
    };

    return { selectedRows, isSelecting, isAllSelected, toggle, selectAll, clear };
  }
}
