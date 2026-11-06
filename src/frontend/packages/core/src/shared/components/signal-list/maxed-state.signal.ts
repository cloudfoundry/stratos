import { DestroyRef, Injector, Signal, computed, runInInjectionContext, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import type { PaginationEntityState } from '@stratosui/store';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

// Lifts the legacy `ListDataSource.maxedResults$` / `maxedStateStartAt$`
// pair into the signal world so wave-β consumers (and the legacy adapter)
// can read maxed-state without subscribing manually. Mirrors the
// semantics used by `<cf-pagination-maxed-state>` in V2:
//
//   * `isMaxedMode` — pagination came back with more rows than the
//     entity's `maxedStateStartAt` cap, so the store flipped to
//     server-side filter mode.
//   * `ignoreMaxed` — the user clicked "load all" (legacy
//     `showAllAfterMax`); we should now treat the list as if no cap
//     existed even though `isMaxedMode` is still true.
//   * `startAt` — the cap value, used for "Showing first N of X" copy
//     in the maxed-state banner.
//
// The wrapper takes the raw `pagination$` observable from a
// `ListDataSource`, plus an optional `maxedStateStartAt$` for the cap
// value. Both feed read-only signals via `toSignal` so consumers can
// read synchronously inside templates / computed chains.
//
// `showAllAfterMax(dispatch)` is a thin pass-through: the caller
// supplies a function that performs the legacy
// `dataSource.showAllAfterMax()` call (which dispatches
// `IgnorePaginationMaxedState`). We don't import the action here to
// keep this file decoupled from the legacy data-source so the eventual
// signal-native data sources can drive maxed-state without inheriting
// the old machinery.
export interface MaxedStateSignal {
  readonly isMaxedMode: Signal<boolean>;
  readonly ignoreMaxed: Signal<boolean>;
  readonly startAt: Signal<number | null>;
  readonly showAllAfterMax: () => void;
}

export interface MaxedStateSignalOptions {
  readonly pagination$: Observable<PaginationEntityState>;
  readonly maxedStateStartAt$?: Observable<number | null>;
  readonly onShowAll: () => void;
  readonly injector: Injector;
}

export function createMaxedStateSignal(opts: MaxedStateSignalOptions): MaxedStateSignal {
  return runInInjectionContext(opts.injector, () => {
    const isMaxedMode = toSignal(
      opts.pagination$.pipe(
        map(p => !!p?.maxedState?.isMaxedMode),
        distinctUntilChanged(),
      ),
      { initialValue: false },
    );
    const ignoreMaxed = toSignal(
      opts.pagination$.pipe(
        map(p => !!p?.maxedState?.ignoreMaxed),
        distinctUntilChanged(),
      ),
      { initialValue: false },
    );
    const startAt = opts.maxedStateStartAt$
      ? toSignal(
          opts.maxedStateStartAt$.pipe(
            map(v => (typeof v === 'number' ? v : null)),
            distinctUntilChanged(),
          ),
          { initialValue: null as number | null },
        )
      : signal<number | null>(null).asReadonly();

    return {
      isMaxedMode,
      ignoreMaxed,
      startAt,
      showAllAfterMax: opts.onShowAll,
    };
  });
}

// Convenience derived signal: true iff the list is currently honoring
// the maxed cap (isMaxedMode AND not yet ignored). The legacy banner
// renders only in this combination — hidden once the user has clicked
// through the "load all" affordance.
export function maxedStateActive(s: MaxedStateSignal): Signal<boolean> {
  return computed(() => s.isMaxedMode() && !s.ignoreMaxed());
}

// Re-export to keep callers from needing two imports when they want to
// scope the wrapper to a destroy ref (e.g. taking the pagination
// observable's last value at component teardown).
export { takeUntilDestroyed, DestroyRef };
