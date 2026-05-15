import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, effect, inject } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';

import {
  GET_CURRENT_USER_RELATIONS_FAILED,
  GET_CURRENT_USER_RELATIONS_SUCCESS,
} from '../actions/permissions.actions';
import {
  CleanRecentsForEndpointsAction,
  PruneRecentsToConnectedAction,
} from '../actions/recently-visited.actions';
import { SendClearEndpointEventsAction } from '../actions/internal-events.actions';
import { ResetPaginationOfType } from '../actions/pagination.actions';
import { AppState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { EntityUserRolesEndpoint } from '../entity-request-pipeline/entity-request-pipeline.types';
import {
  EndpointConnectEvent,
  EndpointDisconnectEvent,
  EndpointsDataService,
} from './endpoints-data.service';

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
 *   synchronously inside the dispatch cycle. Legacy `*_ENDPOINTS_SUCCESS`
 *   listeners in the pagination reducer ran inside the same reducer cycle
 *   as the action that triggered them; the new path re-dispatches
 *   `ResetPaginationOfType` after a microtask. UI bindings could observe
 *   stale pagination for one frame post-disconnect. Acceptable: legacy
 *   pagination consumers already saw async updates through the
 *   Observable/selector pipeline.
 * - The cleanup service drains the disconnect/connect queues every cycle
 *   via `clearDisconnected()` / `clearConnected()`. If a Wave 4-part-2
 *   plugin handler throws, downstream handlers + the queue drain still
 *   run (per-handler try/catch).
 */
@Injectable({ providedIn: 'root' })
export class EndpointDisconnectCleanupService implements OnDestroy {
  private endpointsService = inject(EndpointsDataService);
  private store = inject<Store<AppState>>(Store);
  private httpClient = inject(HttpClient);

  private disconnectHandlers: Array<(event: EndpointDisconnectEvent) => void> = [];
  private connectHandlers: Array<(event: EndpointConnectEvent) => void> = [];

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
    this.store.dispatch(new PruneRecentsToConnectedAction(connectedGuids));
  });

  ngOnDestroy(): void {
    this.disconnectEffect.destroy();
    this.connectEffect.destroy();
    this.pruneRecentsEffect.destroy();
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

  // ---- internals ---------------------------------------------------------

  private runGenericDisconnectCleanup(event: EndpointDisconnectEvent): void {
    // 1. Pagination wipe — replaces the legacy
    //    `pagination.reducer.ts isEndpointAction` branch which called
    //    `resetEndpointEntities(...)` walking
    //    `entityCatalog.getAllEntitiesForEndpointType(action.endpointType)`.
    const entityDefs = entityCatalog.getAllEntitiesForEndpointType(event.type);
    for (const def of entityDefs) {
      this.store.dispatch(
        new ResetPaginationOfType({
          endpointType: def.endpointType,
          entityType: def.type,
        }),
      );
    }
    // 2. Internal-events log clear — replaces the legacy
    //    `internal-events.reducer.ts DISCONNECT/UNREGISTER_ENDPOINTS_SUCCESS`
    //    branches.
    this.store.dispatch(new SendClearEndpointEventsAction(event.guid));
    // 3. Recents cleanup — replaces the legacy
    //    `recently-visited.reducer.ts DISCONNECT/UNREGISTER_ENDPOINTS_SUCCESS`
    //    branch.
    this.store.dispatch(new CleanRecentsForEndpointsAction([event.guid]));
  }

  private runGenericConnectCleanup(event: EndpointConnectEvent): void {
    // 1. Internal-events log clear — replaces the legacy
    //    `internal-events.reducer.ts CONNECT_ENDPOINTS_SUCCESS` branch.
    this.store.dispatch(new SendClearEndpointEventsAction(event.guid));
    // 2. Per-endpoint user-roles fetch — replaces the legacy
    //    `permissions.effect.ts getPermissionForNewlyConnectedEndpoint$`
    //    ngrx effect.
    void this.fetchUserRolesForConnectedEndpoint(event);
  }

  private async fetchUserRolesForConnectedEndpoint(event: EndpointConnectEvent): Promise<void> {
    const endpointType = entityCatalog.getEndpoint(event.type);
    if (!endpointType?.definition?.userRolesFetch) {
      return;
    }
    const endpoint: EntityUserRolesEndpoint = {
      guid: event.guid,
      user: event.user,
    };
    try {
      const succeeded = await firstValueFrom(
        endpointType.definition.userRolesFetch([endpoint], this.store, this.httpClient, this.endpointsService),
      );
      const successAction: Action = { type: GET_CURRENT_USER_RELATIONS_SUCCESS };
      const failedAction: Action = { type: GET_CURRENT_USER_RELATIONS_FAILED };
      this.store.dispatch(succeeded ? successAction : failedAction);
    } catch (err) {
      console.warn('Failed to fetch current user permissions after endpoint connected: ', err);
      this.store.dispatch({ type: GET_CURRENT_USER_RELATIONS_FAILED });
    }
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
