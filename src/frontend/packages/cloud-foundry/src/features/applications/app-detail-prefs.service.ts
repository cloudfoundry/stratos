import { Injectable, inject, signal, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';

import { AppState } from '../../../../store/src/app-state';
import { selectDashboardState } from '../../../../store/src/selectors/dashboard.selectors';

/**
 * Polling interval preferences for the app detail page. Signal-shaped
 * from day one so a future user-config UI can swap in a persisted
 * source without consumer-side changes. One-time legacy bridge from
 * dashboardState.pollingEnabled at construction.
 *
 * Defaults are first-pass; retune from production metrics.
 */
@Injectable({ providedIn: 'root' })
export class AppDetailPrefs {
  private store = inject<Store<AppState>>(Store);

  private readonly _idleSeconds = signal(45);
  private readonly _activeSeconds = signal(5);
  private readonly _enabled = signal(true);

  readonly idleSeconds: Signal<number> = this._idleSeconds.asReadonly();
  readonly activeSeconds: Signal<number> = this._activeSeconds.asReadonly();
  readonly enabled: Signal<boolean> = this._enabled.asReadonly();

  constructor() {
    // Legacy bridge: respect dashboardState.pollingEnabled if explicitly false.
    // Only DOWNGRADE — if explicitly disabled in legacy, respect it; otherwise
    // keep the default (true).
    this.store.select(selectDashboardState).pipe(take(1)).subscribe(state => {
      if (state && state.pollingEnabled === false) {
        this._enabled.set(false);
      }
    });
  }
}
