import { Injectable, OnDestroy, effect, inject } from '@angular/core';

import { EndpointModel } from '../types/endpoint.types';

import { EndpointErrorEventsService } from './endpoint-error-events.service';
import {
  EndpointConnectEvent,
  EndpointDisconnectEvent,
  EndpointsDataService,
} from './endpoints-data.service';
import { RecentlyVisitedDataService } from './recently-visited-data.service';

/**
 * Wave 4 part 1 (W36-B) — endpoint cleanup orchestration.
 *
 * Subscribes to {@link EndpointsDataService} signal deltas and runs the
 * generic per-event cleanup that legacy reducers/effects ran inline on
 * `*_ENDPOINTS_SUCCESS` actions. Plugin layers (CF / git / helm — Wave 4
 * part 2) register additional handlers via {@link registerDisconnectHandler}
 * to wipe their entity-specific slices.
 *
 * Replaces:
 * - `pagination.reducer.ts isEndpointAction -> resetEndpointEntities` walk
 * - `internal-events.reducer.ts *_ENDPOINTS_SUCCESS / UPDATE_ENDPOINT_SUCCESS`
 *   inline branches
 * - `recently-visited.reducer.ts DISCONNECT/UNREGISTER_ENDPOINTS_SUCCESS`
 *   and `GET_ENDPOINTS_SUCCESS` inline branches
 * - `permissions.effect.ts getPermissionForNewlyConnectedEndpoint$` ngrx
 *   effect on `CONNECT_ENDPOINTS_SUCCESS`
 *
 * Bootstrapped eagerly from `AppModule`'s constructor so the signal
 * effects start observing before any user-driven mutation can fire.
 *
 * Architectural notes:
 * - The signal effect runs on Angular's microtask queue, NOT
 *   synchronously inside the dispatch cycle. The signal-native cleanup
 *   (error-events clear, recents prune) runs after a microtask; legacy
 *   pagination consumers already saw async updates through the
 *   Observable/selector pipeline, so the timing change is immaterial.
 * - The cleanup service drains the disconnect/connect queues every cycle
 *   via `clearDisconnected()` / `clearConnected()`. If a Wave 4-part-2
 *   plugin handler throws, downstream handlers + the queue drain still
 *   run (per-handler try/catch).
 */
@Injectable({ providedIn: 'root' })
export class EndpointDisconnectCleanupService implements OnDestroy {
  private endpointsService = inject(EndpointsDataService);
  private recents = inject(RecentlyVisitedDataService);
  private errorEvents = inject(EndpointErrorEventsService);

  private disconnectHandlers: Array<(event: EndpointDisconnectEvent) => void> = [];
  private connectHandlers: Array<(event: EndpointConnectEvent) => void> = [];
  private endpointsObservers: Array<(endpoints: Map<string, EndpointModel>) => void> = [];

  /**
   * Track previously-seen endpoint guids so the prune-recents effect only
   * fires when the endpoint set actually mutates (avoids spurious dispatch
   * on unrelated signal recomputations).
   */
  private lastEndpointGuidSet: Set<string> | null = null;

  private readonly disconnectEffect = effect(() => {
    const events = this.endpointsService.disconnectedSignal();
    if (events.length === 0) {
      return;
    }
    // Snapshot + drain BEFORE iterating so handlers that emit
    // (e.g. another disconnect) won't be lost.
    const snapshot = events.slice();
    this.endpointsService.clearDisconnected();
    for (const event of snapshot) {
      this.runGenericDisconnectCleanup(event);
      for (const handler of this.disconnectHandlers) {
        try {
          handler(event);
        } catch (err) {
          // A misbehaving plugin handler must not poison sibling handlers.
          console.warn('[EndpointDisconnectCleanup] handler threw', err);
        }
      }
    }
  });

  private readonly connectEffect = effect(() => {
    const events = this.endpointsService.connectedSignal();
    if (events.length === 0) {
      return;
    }
    const snapshot = events.slice();
    this.endpointsService.clearConnected();
    for (const event of snapshot) {
      this.runGenericConnectCleanup(event);
      for (const handler of this.connectHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.warn('[EndpointDisconnectCleanup] connect handler threw', err);
        }
      }
    }
  });

  private readonly pruneRecentsEffect = effect(() => {
    const endpoints = this.endpointsService.endpoints();
    const nextSet = new Set<string>(endpoints.keys());
    if (this.lastEndpointGuidSet && setsEqual(this.lastEndpointGuidSet, nextSet)) {
      return;
    }
    this.lastEndpointGuidSet = nextSet;
    // Mirror legacy `recently-visited.reducer.ts GET_ENDPOINTS_SUCCESS`
    // pruning: keep only recents whose endpointId is connected.
    const connectedGuids: string[] = [];
    endpoints.forEach((ep, guid) => {
      if (ep.user) {
        connectedGuids.push(guid);
      }
    });
    this.recents.pruneToConnected(connectedGuids);
  });

  /**
   * Wave 4 part 2 (W36-B): mirrors what legacy `helm.effects.ts
   * updateOnSyncFinished$` did off `GET_ENDPOINTS_SUCCESS` — fires every
   * time the endpoint set is hydrated/refreshed so plugin observers can
   * react to status fields (e.g. "Synchronizing" helm endpoints) without
   * coupling to legacy ngrx actions. Unlike `pruneRecentsEffect`, we do
   * NOT short-circuit on identical-guid sets: an endpoint's metadata
   * (status, sub_type, …) can change without the guid set changing, and
   * helm's sync watcher needs to see those mutations.
   */
  private readonly endpointsHydrationEffect = effect(() => {
    const endpoints = this.endpointsService.endpoints();
    if (this.endpointsObservers.length === 0) {
      return;
    }
    for (const observer of this.endpointsObservers) {
      try {
        observer(endpoints);
      } catch (err) {
        console.warn('[EndpointDisconnectCleanup] endpoints observer threw', err);
      }
    }
  });

  ngOnDestroy(): void {
    this.disconnectEffect.destroy();
    this.connectEffect.destroy();
    this.pruneRecentsEffect.destroy();
    this.endpointsHydrationEffect.destroy();
  }

  /**
   * Wave 4 part 2 calls this from cf-entity-generator /
   * git-entity-generator / helm.effects setup to register entity-specific
   * cleanup that the old per-CF-reducer
   * `endpointDisconnectRemoveEntitiesReducer()` registrations did inline.
   */
  registerDisconnectHandler(handler: (event: EndpointDisconnectEvent) => void): void {
    this.disconnectHandlers.push(handler);
  }

  /**
   * Wave 4 part 2 + helm.effects can register extra connect-side cleanup
   * (e.g. helm hub sync polling kickoff that legacy `registerEndpoint$` /
   * `updateOnSyncFinished$` did via ngrx effects).
   */
  registerConnectHandler(handler: (event: EndpointConnectEvent) => void): void {
    this.connectHandlers.push(handler);
  }

  /**
   * Wave 4 part 2 (W36-B): plugin layers register an observer here to
   * react to every endpoint-set hydration/refresh cycle (replacing
   * `GET_ENDPOINTS_SUCCESS` ngrx action listeners). The handler receives
   * the live `Map<guid, EndpointModel>` after the cleanup service's
   * signal effect fires.
   */
  registerEndpointsObserver(handler: (endpoints: Map<string, EndpointModel>) => void): void {
    this.endpointsObservers.push(handler);
  }

  // ---- internals ---------------------------------------------------------

  private runGenericDisconnectCleanup(event: EndpointDisconnectEvent): void {
    // The legacy ngrx pagination wipe (`ResetPaginationOfType`) and
    // per-entity-slice prune (`RemoveEntitiesForEndpoint`) are gone: the
    // pagination/entity-data reducers they targeted were deleted with the
    // ngrx engine (#5413), and signal data services own their own caches
    // (cleared on read / TTL). What remains is the signal-native cleanup:
    //
    // 1. Endpoint error-log clear — drops the endpoint's history from the
    //    signal-native EndpointErrorEventsService (was
    //    `internal-events.reducer.ts DISCONNECT/UNREGISTER_ENDPOINTS_SUCCESS`).
    this.errorEvents.clearEndpoint(event.guid);
    // 2. Recents cleanup — was
    //    `recently-visited.reducer.ts DISCONNECT/UNREGISTER_ENDPOINTS_SUCCESS`.
    this.recents.cleanForEndpoints([event.guid]);
  }

  private runGenericConnectCleanup(event: EndpointConnectEvent): void {
    // Endpoint error-log clear — replaces the legacy
    // `internal-events.reducer.ts CONNECT_ENDPOINTS_SUCCESS` branch.
    // (Per-endpoint user-roles fetch on connect moved to the CF package's
    // CfEndpointRoleSyncService signal effect — favorites/roles island Wave 2.)
    this.errorEvents.clearEndpoint(event.guid);
  }
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const v of a) {
    if (!b.has(v)) {
      return false;
    }
  }
  return true;
}
