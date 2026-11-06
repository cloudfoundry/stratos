import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppDetailDataService } from '../../features/applications/app-detail-data.service';
import { ApplicationService } from '../../features/applications/application.service';

/**
 * AppInstanceActionsService
 *
 * Per-instance verbs (kill instance) for the app-detail Instances tab.
 * Sibling to slice-1's AppApplicationActionsService — distinct service
 * because the identity tuple is per-instance ((cnsi, app, instanceIndex))
 * rather than per-app, and the state machine is per-row instead of
 * app-singleton. See slice-2 design doc, locked decision #2.
 *
 * Default scope is tab-scoped: the Instances tab provides this service in
 * its component `providers` array so `transitioningIndex` resets cleanly
 * on tab navigation. Step 7 wires the provider; step 3 ships the
 * @Injectable() shape only.
 *
 * Wire: DELETE /pp/v1/cf/apps/{cnsi}/{guid}/instances/{index}
 *   (handler `native_apps_writes.go` `DeleteApplicationInstance`).
 *
 * On success: refresh `dataService.stats()` so the Instances list
 * resyncs. Killed instances are *replaced* by CF, not removed — so we do
 * NOT call `removeRow` on the orchestrator (per slice-2 design Layer 2).
 */
@Injectable()
export class AppInstanceActionsService {
  private http = inject(HttpClient);
  private applicationService = inject(ApplicationService);
  private dataService = inject(AppDetailDataService);

  /** Index of the instance currently being killed; null when idle. */
  private readonly _transitioningIndex = signal<number | null>(null);
  readonly transitioningIndex = this._transitioningIndex.asReadonly();

  /** True while a per-instance verb is in flight. */
  readonly inFlight = computed(() => this._transitioningIndex() !== null);

  /**
   * Kill (terminate + replace) the instance at `index`. CF v3 does not
   * have a true "kill instance" verb — the DELETE on the Stratos-native
   * route is interpreted by Jetstream against the appropriate v3 path.
   *
   * Reentrancy: if a kill is already in flight, a second call rejects
   * rather than queues. Mirrors slice-1's lifecycle.inFlight guard
   * shape — overlapping per-instance verbs would scramble
   * transitioningIndex and the per-row spinner that reads it.
   */
  async killInstance(index: number): Promise<void> {
    if (this.inFlight()) {
      throw new Error('Another instance action is already in flight');
    }
    const { cfGuid, appGuid } = this.applicationService;
    const url = `/pp/v1/cf/apps/${cfGuid}/${appGuid}/instances/${index}`;
    this._transitioningIndex.set(index);
    try {
      await firstValueFrom(this.http.delete(url));
      // Refresh just stats — instance counts/states are the only signal
      // that changes on a kill. App entity, env vars, space/org/domains
      // are unaffected. Slice-1 lesson: refresh('all') causes visible
      // card-wide flicker on lifecycle ops.
      await this.dataService.refresh('stats');
    } finally {
      this._transitioningIndex.set(null);
    }
  }
}
