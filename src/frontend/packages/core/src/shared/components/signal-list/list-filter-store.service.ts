import { Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

// Persists per-list-type filter selections — name-filter text, the
// active filter field (when the toolbar offers a column-picker), and
// every multi-filter dropdown the page declares. Keyed by a list-type
// string (e.g. `cf-apps`, `cf-spaces`); the same slot is shared across
// CNSIs / orgs so the user's preferred filter survives navigation
// between deployments. Persistence prefix is
// `stratos.list-filters.v1.<key>` so the schema can evolve under a new
// version suffix without poisoning older browsers.
//
// This complements `ListStateStore` — that one already covers viewMode,
// pageSize, pageIndex, and sort, but explicitly excludes nameFilter,
// filterField, multi-filter dropdown values, selection state, adding
// state, maxed state, and errors. This store fills the
// nameFilter/filterField/multi-filter slice; `ListSelectionStore` and
// `MaxedStateSignal` cover the remaining gaps.

const STORAGE_PREFIX = 'stratos.list-filters.v1.';

export interface ListFilterDefaults {
  readonly nameFilter: string;
  readonly filterField: string;
  // Map of multi-filter key → selected value. `null` means the "All"
  // option (or unset). Multi-filter values come from
  // `IListMultiFilterConfig.list$` and are stable across page renders.
  readonly multiFilters: Readonly<Record<string, string | null>>;
}

export interface BoundListFilterState {
  readonly nameFilter: WritableSignal<string>;
  readonly filterField: WritableSignal<string>;
  readonly multiFilters: WritableSignal<Readonly<Record<string, string | null>>>;
  // Convenience read for a single multi-filter key. Returns null when
  // the key is unset (no value persisted yet) or explicitly cleared.
  readonly multiFilterValue: (key: string) => Signal<string | null>;
  // Convenience write for a single multi-filter key. Pass `null` to
  // clear (equivalent to selecting the "All" option).
  readonly setMultiFilter: (key: string, value: string | null) => void;
  // Resets every field to the defaults supplied to `bind()`. Used by
  // the toolbar's "Clear" button. Persistence catches up via the same
  // effect as any other write.
  readonly clear: () => void;
}

const EMPTY_FILTERS: Readonly<Record<string, string | null>> = Object.freeze({});

@Injectable({ providedIn: 'root' })
export class ListFilterStore {
  private readonly injector = inject(Injector);

  bind(key: string, defaults: ListFilterDefaults): BoundListFilterState {
    const persisted = this.read(key);
    const initial: ListFilterDefaults = persisted ?? defaults;

    const nameFilter = signal(initial.nameFilter);
    const filterField = signal(initial.filterField);
    const multiFilters = signal<Readonly<Record<string, string | null>>>(
      initial.multiFilters ?? EMPTY_FILTERS,
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const snapshot: ListFilterDefaults = {
          nameFilter: nameFilter(),
          filterField: filterField(),
          multiFilters: multiFilters(),
        };
        this.write(key, snapshot);
      });
    });

    const multiFilterValue = (k: string): Signal<string | null> =>
      computed(() => {
        const m = multiFilters();
        return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null;
      });

    const setMultiFilter = (k: string, value: string | null): void => {
      multiFilters.update(curr => ({ ...curr, [k]: value }));
    };

    const clear = (): void => {
      nameFilter.set(defaults.nameFilter);
      filterField.set(defaults.filterField);
      multiFilters.set(defaults.multiFilters ?? EMPTY_FILTERS);
    };

    return { nameFilter, filterField, multiFilters, multiFilterValue, setMultiFilter, clear };
  }

  private read(key: string): ListFilterDefaults | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<ListFilterDefaults>;
      // Schema-tolerant read: every field must be the right shape or we
      // fall back to defaults. Multi-filter map can be missing (older
      // entries) — we coerce to the empty object instead of bailing.
      if (
        typeof parsed.nameFilter === 'string' &&
        typeof parsed.filterField === 'string' &&
        (parsed.multiFilters === undefined || isMultiFilterMap(parsed.multiFilters))
      ) {
        return {
          nameFilter: parsed.nameFilter,
          filterField: parsed.filterField,
          multiFilters: (parsed.multiFilters ?? EMPTY_FILTERS) as Readonly<Record<string, string | null>>,
        };
      }
    } catch {
      // Corrupt JSON or unavailable storage — fall through to defaults.
    }
    return null;
  }

  private write(key: string, value: ListFilterDefaults): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled — drop on the floor; the
      // in-memory signals still drive the UI for the current session.
    }
  }
}

function isMultiFilterMap(v: unknown): v is Record<string, string | null> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  for (const k of Object.keys(v as Record<string, unknown>)) {
    const val = (v as Record<string, unknown>)[k];
    if (val !== null && typeof val !== 'string') return false;
  }
  return true;
}
