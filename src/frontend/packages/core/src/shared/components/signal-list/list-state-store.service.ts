import { Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

import type { SignalListSort, SignalListViewMode } from './signal-list.component';

// Per-mode list state — pageSize, pageIndex, AND sort live in tuples
// indexed [card, table] so toggling viewMode preserves "where you were"
// in each mode without losing the other's value. Sort is per-mode too:
// users often want different orderings in card vs table (e.g. card view
// sorted by recency, table view sorted by name) and not have a toggle
// silently rearrange their content.
//
// Persistence scope is the list-type key (e.g. `cf-spaces`, `cf-apps`).
// The same slot is shared across CNSIs / orgs — pageSize/sort/etc. are
// UI preferences, not per-deployment facts.
//
// Keying: `stratos.list-state.v1.<list-type>` in localStorage. Versioned
// so the schema can evolve without breaking older browsers.

const STORAGE_PREFIX = 'stratos.list-state.v1.';

export type ModeTuple<T> = readonly [card: T, table: T];
// Backwards-compat alias retained for callers that imported the
// number-specific name; prefer `ModeTuple<number>` going forward.
export type ModeIndexedTuple = ModeTuple<number>;

export interface ListStateDefaults {
  viewMode: SignalListViewMode;
  pageSize: ModeTuple<number>;
  pageIndex: ModeTuple<number>;
  sort: ModeTuple<SignalListSort>;
}

export interface BoundListState {
  // Persisted state — write directly for clearFilters/programmatic resets.
  readonly viewMode: WritableSignal<SignalListViewMode>;
  readonly pageSizeByMode: WritableSignal<ModeTuple<number>>;
  readonly pageIndexByMode: WritableSignal<ModeTuple<number>>;
  readonly sortByMode: WritableSignal<ModeTuple<SignalListSort>>;

  // Mode-active "current" views — what the SignalListComponent reads
  // and writes via the dropdown / sortable headers. Reads return the
  // slot for the active viewMode; writes update only that slot.
  readonly pageSize: WritableSignal<number>;
  readonly pageIndex: WritableSignal<number>;
  readonly sort: WritableSignal<SignalListSort>;
}

@Injectable({ providedIn: 'root' })
export class ListStateStore {
  private readonly injector = inject(Injector);

  bind(key: string, defaults: ListStateDefaults): BoundListState {
    const persisted = this.read(key);
    const initial: ListStateDefaults = persisted ?? defaults;

    const viewMode = signal(initial.viewMode);
    const pageSizeByMode = signal(initial.pageSize);
    const pageIndexByMode = signal(initial.pageIndex);
    const sortByMode = signal(initial.sort);

    const pageSize = makeModeSignal(viewMode, pageSizeByMode);
    const pageIndex = makeModeSignal(viewMode, pageIndexByMode);
    const sort = makeModeSignal(viewMode, sortByMode);

    // Persist on any change. Effect runs in a dedicated injection context
    // so config services can call bind() outside an injection context
    // (e.g. inside a field initializer).
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const snapshot: ListStateDefaults = {
          viewMode: viewMode(),
          pageSize: pageSizeByMode(),
          pageIndex: pageIndexByMode(),
          sort: sortByMode(),
        };
        this.write(key, snapshot);
      });
    });

    return { viewMode, pageSizeByMode, pageIndexByMode, sortByMode, pageSize, pageIndex, sort };
  }

  private read(key: string): ListStateDefaults | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<ListStateDefaults>;
      // Schema-tolerant read: every field must be present and shape-correct
      // or we fall back to defaults. Keeps us robust to schema drift across
      // versions even though the prefix is versioned.
      if (
        (parsed.viewMode === 'card' || parsed.viewMode === 'table') &&
        isNumberTuple(parsed.pageSize) &&
        isNumberTuple(parsed.pageIndex) &&
        isSortTuple(parsed.sort)
      ) {
        return parsed as ListStateDefaults;
      }
    } catch {
      // Corrupt JSON or unavailable storage — fall through to defaults.
    }
    return null;
  }

  private write(key: string, value: ListStateDefaults): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled — drop on the floor; the
      // in-memory signals still drive the UI for the current session.
    }
  }
}

// Returns a signal-callable that reads the slot of `tuple` for the
// current `viewMode`, and whose .set/.update mutate only that slot.
// Reactive: depends on both viewMode and tuple via the inner computed.
function makeModeSignal<T>(
  viewMode: Signal<SignalListViewMode>,
  tuple: WritableSignal<ModeTuple<T>>,
): WritableSignal<T> {
  const read = computed(() => tuple()[viewMode() === 'card' ? 0 : 1]);
  const callable = (() => read()) as WritableSignal<T>;
  callable.set = (v: T): void => {
    tuple.update(([c, t]) => viewMode() === 'card' ? [v, t] as const : [c, v] as const);
  };
  callable.update = (fn: (cur: T) => T): void => {
    callable.set(fn(read()));
  };
  callable.asReadonly = () => read;
  return callable;
}

function isNumberTuple(v: unknown): v is ModeTuple<number> {
  return Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number';
}

function isSortTuple(v: unknown): v is ModeTuple<SignalListSort> {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    isSort(v[0]) &&
    isSort(v[1])
  );
}

function isSort(v: unknown): v is SignalListSort {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<SignalListSort>;
  return typeof s.field === 'string' && (s.direction === 'asc' || s.direction === 'desc');
}
