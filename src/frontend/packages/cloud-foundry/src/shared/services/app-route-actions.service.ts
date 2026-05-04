import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApplicationService } from '../../features/applications/application.service';
import { writeWithJob } from '../../services/async-jobs/write-with-job';

/**
 * AppRouteActionsService
 *
 * Per-route verbs (unmap, delete) for the app-detail Routes tab.
 * Sibling to slice-2's AppInstanceActionsService — distinct service
 * because the identity tuple is per-route ((cnsi, app, routeGuid))
 * rather than per-instance, and the lifecycle is true row removal
 * (not replace-then-converge). See slice-3 design doc Layer 2.
 *
 * Default scope is tab-scoped: the Routes tab provides this service in
 * its component `providers` array (commit #5) so `transitioningRouteGuid`
 * resets cleanly on tab navigation. Mirrors slice-2's lifetime.
 *
 * Wires:
 *   unmap : DELETE /pp/v1/cf/routes/{cnsi}/{routeGuid}/apps/{appGuid}
 *           — synchronous, no job (handler `unmapRouteFromApp`).
 *   delete: DELETE /pp/v1/cf/routes/{cnsi}/{routeGuid}
 *           — V3 returns 202 + job (handler `deleteNativeRoute`); routed
 *           through writeWithJob with settling poll.
 *
 * Cache eviction is the consumer's responsibility: on success the
 * Routes tab (commit #5) calls `dataService.removeRoute(guid)`. The
 * action service stays focused on the verb call + transition signalling.
 * Mirrors slice-2 where killInstance did not directly mutate the
 * orchestrator — the consumer wired the success callback.
 */
@Injectable()
export class AppRouteActionsService {
  private http = inject(HttpClient);
  private applicationService = inject(ApplicationService);

  /** GUID of the route currently being unmapped/deleted; null when idle. */
  private readonly _transitioningRouteGuid = signal<string | null>(null);
  readonly transitioningRouteGuid = this._transitioningRouteGuid.asReadonly();

  /** True while a per-route verb is in flight. */
  readonly inFlight = computed(() => this._transitioningRouteGuid() !== null);

  /**
   * Unmap a route from the current app. Synchronous on the wire — the
   * Stratos-native handler returns once V3 has removed the destination.
   *
   * Reentrancy: rejects if another verb is already in flight. Overlapping
   * per-route verbs would scramble transitioningRouteGuid and the per-row
   * spinner that reads it. Mirrors slice-1/slice-2 lifecycle guard shape.
   */
  async unmapRoute(routeGuid: string): Promise<void> {
    if (this.inFlight()) {
      throw new Error('Another route action is already in flight');
    }
    const { cfGuid, appGuid } = this.applicationService;
    const url = `/pp/v1/cf/routes/${cfGuid}/${routeGuid}/apps/${appGuid}`;
    this._transitioningRouteGuid.set(routeGuid);
    try {
      await firstValueFrom(this.http.delete(url));
    } finally {
      this._transitioningRouteGuid.set(null);
    }
  }

  /**
   * Delete a route entirely. CF V3 returns 202 + job; we route through
   * writeWithJob so the Promise resolves only when the job settles
   * (COMPLETE) or rejects on FAILED. The transitioningRouteGuid signal
   * stays set across the full settling window so the per-row spinner
   * holds until the route is truly gone.
   */
  async deleteRoute(routeGuid: string): Promise<void> {
    if (this.inFlight()) {
      throw new Error('Another route action is already in flight');
    }
    const { cfGuid } = this.applicationService;
    const url = `/pp/v1/cf/routes/${cfGuid}/${routeGuid}`;
    this._transitioningRouteGuid.set(routeGuid);
    try {
      // observe: 'response' so writeWithJob can discriminate 200 fast-path
      // from 202 + Location handoff.
      const call = this.http.delete(url, { observe: 'response' });
      await writeWithJob(this.http, call);
    } finally {
      this._transitioningRouteGuid.set(null);
    }
  }
}
