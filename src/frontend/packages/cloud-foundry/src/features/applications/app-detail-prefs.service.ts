import { Injectable, inject, signal, Signal } from '@angular/core';

import { DashboardDataService } from '../../../../core/src/core/dashboard-data.service';

/**
 * Polling interval preferences for the app detail page. Signal-shaped
 * from day one so a future user-config UI can swap in a persisted
 * source without consumer-side changes. One-time legacy bridge from
 * dashboardData.pollingEnabled at construction.
 *
 * Defaults are first-pass; retune from production metrics.
 */
@Injectable({ providedIn: 'root' })
export class AppDetailPrefs {
  private dashboardData = inject(DashboardDataService);

  private readonly _idleSeconds = signal(45);
  private readonly _activeSeconds = signal(5);
  private readonly _enabled = signal(true);

  readonly idleSeconds: Signal<number> = this._idleSeconds.asReadonly();
  readonly activeSeconds: Signal<number> = this._activeSeconds.asReadonly();
  readonly enabled: Signal<boolean> = this._enabled.asReadonly();

  constructor() {
    // Legacy bridge: respect dashboardData.pollingEnabled if explicitly false.
    // Only DOWNGRADE — if explicitly disabled in legacy, respect it; otherwise
    // keep the default (true).
    if (this.dashboardData.pollingEnabled() === false) {
      this._enabled.set(false);
    }
  }
}
