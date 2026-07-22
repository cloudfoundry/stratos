import { Injectable, Signal, WritableSignal, effect, inject, signal } from '@angular/core';

import { SessionService } from './session.service';

export const DASHBOARD_PREFS_STORAGE_KEY_PREFIX = 'stratos-home-prefs-';

export type HomeSortDirection = 'asc' | 'desc';

// Which endpoints the Home page shows:
// favorites = starred endpoints (directly or via starred children), any state
// connected = every connected endpoint
// all       = every registered endpoint, any state
export type HomeShowMode = 'favorites' | 'connected' | 'all';

interface DashboardPrefs {
  homeShowMode: HomeShowMode | null;
  // Legacy boolean pref (pre three-way control); read for migration only
  homeShowAllEndpoints?: boolean | null;
  homeLayout: number;
  homeSortDirection: HomeSortDirection;
}

const DEFAULT_PREFS: DashboardPrefs = {
  homeShowMode: null,
  homeLayout: 0,
  homeSortDirection: 'asc',
};

@Injectable({ providedIn: 'root' })
export class DashboardPreferencesService {
  private sessionService = inject(SessionService);

  private readonly _homeShowMode: WritableSignal<HomeShowMode | null> = signal<HomeShowMode | null>(DEFAULT_PREFS.homeShowMode);
  private readonly _homeLayout: WritableSignal<number> = signal<number>(DEFAULT_PREFS.homeLayout);
  private readonly _homeSortDirection: WritableSignal<HomeSortDirection> = signal<HomeSortDirection>(DEFAULT_PREFS.homeSortDirection);

  readonly homeShowMode: Signal<HomeShowMode | null> = this._homeShowMode.asReadonly();
  readonly homeLayout: Signal<number> = this._homeLayout.asReadonly();
  readonly homeSortDirection: Signal<HomeSortDirection> = this._homeSortDirection.asReadonly();

  private hydrated = false;

  constructor() {
    effect(() => {
      const username = this.currentUsername();
      if (!username || this.hydrated) {
        return;
      }
      const stored = this.read(username);
      if (stored) {
        // Migrate the pre-three-way boolean pref: true meant "all connected",
        // false meant "favorites only".
        const migrated: HomeShowMode | null = stored.homeShowMode
          ?? (stored.homeShowAllEndpoints === true ? 'connected'
            : stored.homeShowAllEndpoints === false ? 'favorites' : null);
        this._homeShowMode.set(migrated);
        this._homeLayout.set(stored.homeLayout ?? DEFAULT_PREFS.homeLayout);
        this._homeSortDirection.set(stored.homeSortDirection ?? DEFAULT_PREFS.homeSortDirection);
      }
      this.hydrated = true;
    });

    effect(() => {
      const next: DashboardPrefs = {
        homeShowMode: this._homeShowMode(),
        homeLayout: this._homeLayout(),
        homeSortDirection: this._homeSortDirection(),
      };
      const username = this.currentUsername();
      if (!username || !this.hydrated) {
        return;
      }
      this.write(username, next);
    });
  }

  setHomeShowMode(value: HomeShowMode | null): void {
    this._homeShowMode.set(value);
  }

  setHomeLayout(layoutId: number): void {
    this._homeLayout.set(layoutId);
  }

  setHomeSortDirection(direction: HomeSortDirection): void {
    this._homeSortDirection.set(direction);
  }

  private currentUsername(): string | null {
    const sd = this.sessionService.sessionData();
    return sd?.user?.name ?? null;
  }

  private storageKey(username: string): string {
    return `${DASHBOARD_PREFS_STORAGE_KEY_PREFIX}${username}`;
  }

  private read(username: string): DashboardPrefs | null {
    try {
      const raw = localStorage.getItem(this.storageKey(username));
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as DashboardPrefs;
    } catch {
      return null;
    }
  }

  private write(username: string, prefs: DashboardPrefs): void {
    try {
      localStorage.setItem(this.storageKey(username), JSON.stringify(prefs));
    } catch {
      // localStorage write failure is non-fatal
    }
  }
}
