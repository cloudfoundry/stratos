import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { DashboardOnlyAppState, DashboardState, selectDashboardState } from '@stratosui/store';

const EMPTY_DASHBOARD: DashboardState = {} as DashboardState;

/**
 * Signal-native projection of the `dashboard` ngrx slice.
 *
 * Read-through wrapper over `Store.select(selectDashboardState)`. Mirrors
 * every field of `DashboardState` as a derived signal so consumers can read
 * sidenav/mobile/polling/gravatar/home-layout state without subscriptions.
 *
 * Writes still go through `SetDashboardStateValueAction` against the store —
 * this service is read-side only.
 */
@Injectable({ providedIn: 'root' })
export class DashboardSignalService {
  private store = inject<Store<DashboardOnlyAppState>>(Store);

  /** Raw dashboard slice. Empty object before the store hydrates. */
  readonly dashboard: Signal<DashboardState> = toSignal(
    this.store.select(selectDashboardState),
    { initialValue: EMPTY_DASHBOARD }
  );

  readonly isMobile: Signal<boolean> = computed(() => !!this.dashboard().isMobile);
  readonly isMobileNavOpen: Signal<boolean> = computed(() => !!this.dashboard().isMobileNavOpen);
  readonly sidenavOpen: Signal<boolean> = computed(() => !!this.dashboard().sidenavOpen);
  readonly sideNavPinned: Signal<boolean> = computed(() => !!this.dashboard().sideNavPinned);
  readonly headerEventMinimized: Signal<boolean> = computed(
    () => !!this.dashboard().headerEventMinimized
  );
  readonly gravatarEnabled: Signal<boolean> = computed(
    () => !!this.dashboard().gravatarEnabled
  );
  readonly pollingEnabled: Signal<boolean> = computed(
    () => !!this.dashboard().pollingEnabled
  );
  readonly timeoutSession: Signal<boolean> = computed(
    () => !!this.dashboard().timeoutSession
  );
  readonly homeLayout: Signal<number> = computed(() => this.dashboard().homeLayout ?? 0);
  readonly homeShowAllEndpoints: Signal<boolean | null> = computed(() => {
    const v = this.dashboard().homeShowAllEndpoints;
    return v === undefined ? null : v;
  });
}
