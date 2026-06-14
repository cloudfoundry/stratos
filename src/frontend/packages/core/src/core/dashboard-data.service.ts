import { Injectable, Signal, computed, signal } from '@angular/core';

/**
 * UI dashboard preferences. Replaces the @stratosui/store `dashboard`
 * slice (effects + reducer + actions + selectors). Persists to
 * localStorage under the legacy per-user key (`stratos-<username>`)
 * managed by `LocalStorageService.localStorageToStore`, which now calls
 * {@link hydrateFromStorage} on `SESSION_VERIFIED` instead of dispatching
 * `HydrateDashboardStateAction`.
 *
 * On the write path the legacy `ngrx-store-localstorage` metaReducer is
 * gone for this slice; `update()` writes the latest state to localStorage
 * after every mutation, but only after hydration (so user prefs aren't
 * clobbered by defaults before SESSION_VERIFIED fires).
 */
export interface DashboardState {
  timeoutSession: boolean;
  pollingEnabled: boolean;
  sidenavOpen: boolean;
  isMobile: boolean;
  isMobileNavOpen: boolean;
  sideNavPinned: boolean;
  /** @deprecated Theme mode now managed by StratosBrandingService via localStorage */
  themeKey: string | null;
  headerEventMinimized: boolean;
  gravatarEnabled: boolean;
  homeLayout: number;
  homeShowAllEndpoints: boolean | null;
}

export const defaultDashboardState: DashboardState = {
  timeoutSession: true,
  pollingEnabled: true,
  sidenavOpen: true,
  isMobile: false,
  isMobileNavOpen: false,
  sideNavPinned: true,
  themeKey: null,
  headerEventMinimized: false,
  gravatarEnabled: false,
  homeLayout: 0,
  homeShowAllEndpoints: null,
};

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly _state = signal<DashboardState>({ ...defaultDashboardState });
  private hydrated = false;
  private storageKey: string | null = null;

  readonly state: Signal<DashboardState> = this._state.asReadonly();

  readonly timeoutSession: Signal<boolean> = computed(() => !!this._state().timeoutSession);
  readonly pollingEnabled: Signal<boolean> = computed(() => !!this._state().pollingEnabled);
  readonly sidenavOpen: Signal<boolean> = computed(() => !!this._state().sidenavOpen);
  readonly isMobile: Signal<boolean> = computed(() => !!this._state().isMobile);
  readonly isMobileNavOpen: Signal<boolean> = computed(() => !!this._state().isMobileNavOpen);
  readonly sideNavPinned: Signal<boolean> = computed(() => !!this._state().sideNavPinned);
  readonly headerEventMinimized: Signal<boolean> = computed(() => !!this._state().headerEventMinimized);
  readonly gravatarEnabled: Signal<boolean> = computed(() => !!this._state().gravatarEnabled);
  readonly homeLayout: Signal<number> = computed(() => this._state().homeLayout ?? 0);
  readonly homeShowAllEndpoints: Signal<boolean | null> = computed(() => {
    const v = this._state().homeShowAllEndpoints;
    return v === undefined ? null : v;
  });

  /**
   * Called from `LocalStorageService.localStorageToStore` once the user
   * is known. Reads the user-keyed dashboard prefs from localStorage and
   * merges them onto the defaults. Subsequent mutations write through.
   */
  hydrateFromStorage(storageKey: string, raw: string | null): void {
    this.storageKey = storageKey;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<DashboardState>;
        this._state.set({ ...defaultDashboardState, ...parsed });
      } catch {
        // Ignore malformed prefs — keep defaults.
      }
    }
    this.hydrated = true;
  }

  toggleSideNav(): void {
    this.update(s =>
      s.isMobile
        ? { ...s, isMobileNavOpen: !s.isMobileNavOpen }
        : { ...s, sidenavOpen: !s.sidenavOpen }
    );
  }

  openSideNav(): void {
    this.update(s =>
      s.isMobile ? { ...s, isMobileNavOpen: true } : { ...s, sidenavOpen: true }
    );
  }

  closeSideNav(): void {
    this.update(s =>
      s.isMobile ? { ...s, isMobileNavOpen: false } : { ...s, sidenavOpen: false }
    );
  }

  enableMobileNav(): void {
    this.update(s => ({ ...s, isMobile: true, isMobileNavOpen: false }));
  }

  disableMobileNav(): void {
    this.update(s => ({ ...s, isMobile: false, isMobileNavOpen: false }));
  }

  setSessionTimeout(value: boolean): void {
    this.update(s => ({ ...s, timeoutSession: value }));
  }

  setPollingEnabled(value: boolean): void {
    this.update(s => ({ ...s, pollingEnabled: value }));
  }

  setGravatarEnabled(value: boolean): void {
    this.update(s => ({ ...s, gravatarEnabled: value }));
  }

  setHomeLayout(id: number): void {
    this.update(s => ({ ...s, homeLayout: id }));
  }

  setHomeShowAllEndpoints(value: boolean | null): void {
    this.update(s => ({ ...s, homeShowAllEndpoints: value }));
  }

  setHeaderEventMinimized(value: boolean): void {
    this.update(s => ({ ...s, headerEventMinimized: value }));
  }

  setSideNavPinned(value: boolean): void {
    this.update(s => ({ ...s, sideNavPinned: value }));
  }

  /** Generic key/value setter — replaces SetDashboardStateValueAction. */
  setValue<K extends keyof DashboardState>(key: K, value: DashboardState[K]): void {
    if (!Object.hasOwn(defaultDashboardState, key)) {
      console.warn(`DashboardDataService.setValue: Unknown property ${String(key)}`);
      return;
    }
    this.update(s => ({ ...s, [key]: value }));
  }

  private update(fn: (s: DashboardState) => DashboardState): void {
    const next = fn(this._state());
    this._state.set(next);
    if (this.hydrated && this.storageKey) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(next));
      } catch {
        // Quota / disabled storage — non-fatal.
      }
    }
  }
}
