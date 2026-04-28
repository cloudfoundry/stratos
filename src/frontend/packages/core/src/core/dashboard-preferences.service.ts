import { Injectable, Signal, WritableSignal, effect, inject, signal } from '@angular/core';

import { SessionService } from './session.service';

export const DASHBOARD_PREFS_STORAGE_KEY_PREFIX = 'stratos-home-prefs-';

interface DashboardPrefs {
  homeShowAllEndpoints: boolean | null;
  homeLayout: number;
}

const DEFAULT_PREFS: DashboardPrefs = {
  homeShowAllEndpoints: null,
  homeLayout: 0,
};

@Injectable({ providedIn: 'root' })
export class DashboardPreferencesService {
  private sessionService = inject(SessionService);

  private readonly _homeShowAllEndpoints: WritableSignal<boolean | null> = signal<boolean | null>(DEFAULT_PREFS.homeShowAllEndpoints);
  private readonly _homeLayout: WritableSignal<number> = signal<number>(DEFAULT_PREFS.homeLayout);

  readonly homeShowAllEndpoints: Signal<boolean | null> = this._homeShowAllEndpoints.asReadonly();
  readonly homeLayout: Signal<number> = this._homeLayout.asReadonly();

  private hydrated = false;

  constructor() {
    effect(() => {
      const username = this.currentUsername();
      if (!username || this.hydrated) {
        return;
      }
      const stored = this.read(username);
      if (stored) {
        this._homeShowAllEndpoints.set(stored.homeShowAllEndpoints ?? DEFAULT_PREFS.homeShowAllEndpoints);
        this._homeLayout.set(stored.homeLayout ?? DEFAULT_PREFS.homeLayout);
      }
      this.hydrated = true;
    });

    effect(() => {
      const next: DashboardPrefs = {
        homeShowAllEndpoints: this._homeShowAllEndpoints(),
        homeLayout: this._homeLayout(),
      };
      const username = this.currentUsername();
      if (!username || !this.hydrated) {
        return;
      }
      this.write(username, next);
    });
  }

  setHomeShowAllEndpoints(value: boolean | null): void {
    this._homeShowAllEndpoints.set(value);
  }

  setHomeLayout(layoutId: number): void {
    this._homeLayout.set(layoutId);
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
