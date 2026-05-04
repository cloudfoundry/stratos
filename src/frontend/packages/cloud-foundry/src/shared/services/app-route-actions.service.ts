import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApplicationService } from '../../features/applications/application.service';
import type { StRoute } from '../../services/endpoint-data/stratos-types';
import { writeWithJob } from '../../services/async-jobs/write-with-job';

/**
 * Stratos-shape mirror of CF V3's `capi.RouteCreateRequest`. Sent as the
 * body of `POST /pp/v1/cf/routes/{cnsi}` (handler `createNativeRoute`,
 * see src/jetstream/plugins/cloudfoundry/native_routes_writes.go).
 *
 * `host` and `path` are optional (empty string allowed; CF accepts both
 * "no host" and "no path" in different combinations depending on the
 * domain). `port` is `*int` on the wire — `null` means "not specified"
 * (HTTP route or random TCP port assignment), an integer pins the port.
 * `relationships.space` and `relationships.domain` are both required.
 */
export interface CreateRouteRequest {
  host?: string;
  path?: string;
  port?: number | null;
  relationships: {
    space: { data: { guid: string } };
    domain: { data: { guid: string } };
  };
}

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

  /**
   * Attach an existing route to the current app (V3 destination semantics).
   *
   * Wire: `PUT /pp/v1/cf/apps/{cnsi}/{app}/routes/{routeGuid}` — handler
   * `assignRouteToApp` returns 200 with **empty body** (it discards the
   * upstream destinations payload), so this method resolves to `void`.
   * Synchronous on the wire; no job polling.
   *
   * Reentrancy: rejects if any per-route verb (unmap/delete/attach/create)
   * is already in flight. `transitioningRouteGuid` is set to the target
   * `routeGuid` for the duration of the call.
   */
  async attachRoute(routeGuid: string): Promise<void> {
    if (this.inFlight()) {
      throw new Error('Another route action is already in flight');
    }
    const { cfGuid, appGuid } = this.applicationService;
    const url = `/pp/v1/cf/apps/${cfGuid}/${appGuid}/routes/${routeGuid}`;
    this._transitioningRouteGuid.set(routeGuid);
    try {
      await firstValueFrom(this.http.put(url, {}));
    } finally {
      this._transitioningRouteGuid.set(null);
    }
  }

  /**
   * Create a new route in the current CF endpoint's space/domain.
   *
   * Wire: `POST /pp/v1/cf/routes/{cnsi}` — handler `createNativeRoute`
   * returns 201 with the created route in `StRoute` shape. Synchronous;
   * no job polling.
   *
   * `transitioningRouteGuid` is set to the sentinel `'new'` for the
   * duration of the call (no real GUID exists yet). Reentrancy: rejects
   * if any per-route verb is already in flight.
   */
  async createRoute(req: CreateRouteRequest): Promise<StRoute> {
    if (this.inFlight()) {
      throw new Error('Another route action is already in flight');
    }
    const { cfGuid } = this.applicationService;
    const url = `/pp/v1/cf/routes/${cfGuid}`;
    this._transitioningRouteGuid.set('new');
    try {
      return await firstValueFrom(this.http.post<StRoute>(url, req));
    } finally {
      this._transitioningRouteGuid.set(null);
    }
  }

  /**
   * Two-step "create new route then attach to app" flow.
   *
   * Both wire calls are synchronous. If the create succeeds but the attach
   * fails, the freshly-created route is left **orphaned** in the space —
   * we do NOT auto-delete it (could clobber a route the user wanted to
   * keep). Instead, the rejection error is enriched with:
   *   - human-readable message naming the orphan guid + url
   *   - `(err as any).orphanRoute` carrying the full `StRoute` so the
   *     consumer can offer manual cleanup.
   *
   * On the happy path, returns the created route (the attach call has an
   * empty response body).
   *
   * Reentrancy: rejects if any per-route verb is already in flight at
   * entry. Each step's `_transitioningRouteGuid` lifecycle is owned by
   * `createRoute` / `attachRoute` themselves — between the two calls the
   * signal briefly clears (idle), which is acceptable because no other
   * caller can race in within the same microtask boundary on the same
   * service instance.
   */
  async createAndAttachRoute(req: CreateRouteRequest): Promise<StRoute> {
    if (this.inFlight()) {
      throw new Error('Another route action is already in flight');
    }
    const created = await this.createRoute(req);
    try {
      await this.attachRoute(created.guid);
      return created;
    } catch (err) {
      const orphanErr = new Error(
        `Route created but attach failed. Orphan route in space: guid=${created.guid} url=${created.url}. Original error: ${(err as Error).message}`,
      );
      (orphanErr as { orphanRoute?: StRoute }).orphanRoute = created;
      throw orphanErr;
    }
  }
}
