import { Injectable, OnDestroy, effect, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  AppState,
  AuthDataService,
  EndpointsDataService,
  EndpointDisconnectCleanupService,
} from '@stratosui/store';

import { CF_ENDPOINT_TYPE } from '../../cf-types';
import {
  CfRoleEndpointConnectedAction,
  CfRoleEndpointRegisteredAction,
  CfRoleEndpointRemovedAction,
  CfRoleSessionEndpointsAction,
} from '../actions/cf-endpoint-role.actions';

/**
 * Wave 5 (W36-B) — CF role-state lifecycle wiring.
 *
 * Replaces the legacy ngrx-action listeners on REGISTER/CONNECT/DISCONNECT/
 * UNREGISTER_ENDPOINTS_SUCCESS in `currentCfUserRolesReducer`. The cleanup
 * service exposes connect/disconnect deltas + the live endpoints map; this
 * service translates those into the new CF-specific role-state actions.
 *
 * Bootstrapped eagerly from `CloudFoundryStoreModule` so the signal
 * effects start observing before any user-driven mutation can fire.
 */
@Injectable({ providedIn: 'root' })
export class CfEndpointRoleSyncService implements OnDestroy {
  private endpointsService = inject(EndpointsDataService);
  private cleanup = inject(EndpointDisconnectCleanupService);
  private authData = inject(AuthDataService);
  private store = inject<Store<AppState>>(Store);

  /** Track which CF endpoint guids we've already seeded a role-state row for. */
  private seenCfGuids = new Set<string>();

  /** Detect newly-registered CF endpoints (legacy REGISTER_ENDPOINTS_SUCCESS). */
  private readonly registerEffect = effect(() => {
    const endpoints = this.endpointsService.endpoints();
    endpoints.forEach((ep, guid) => {
      if (ep.cnsi_type !== CF_ENDPOINT_TYPE) {
        return;
      }
      if (!this.seenCfGuids.has(guid)) {
        this.seenCfGuids.add(guid);
        this.store.dispatch(new CfRoleEndpointRegisteredAction(guid));
      }
    });
    // Also drop tracking for endpoints that disappeared (covers unregister
    // without explicit disconnect dispatch).
    for (const tracked of Array.from(this.seenCfGuids)) {
      if (!endpoints.has(tracked)) {
        this.seenCfGuids.delete(tracked);
      }
    }
  });

  /**
   * Propagate CF admin permissions from verified-session endpoints. Replaces
   * the auth slice's `SESSION_VERIFIED` reducer case: fires whenever
   * `AuthDataService.sessionData` gains endpoints (i.e. once per verify, since
   * the signal holds the same object until the next verify replaces it).
   */
  private readonly sessionEndpointsEffect = effect(() => {
    const sessionData = this.authData.sessionData();
    if (sessionData?.endpoints) {
      this.store.dispatch(new CfRoleSessionEndpointsAction(sessionData));
    }
  });

  constructor() {
    this.cleanup.registerConnectHandler(event => {
      if (event.type !== CF_ENDPOINT_TYPE) {
        return;
      }
      this.store.dispatch(new CfRoleEndpointConnectedAction(event.guid, event.user));
    });
    this.cleanup.registerDisconnectHandler(event => {
      if (event.type !== CF_ENDPOINT_TYPE) {
        return;
      }
      this.store.dispatch(new CfRoleEndpointRemovedAction(event.guid));
    });
  }

  ngOnDestroy(): void {
    this.registerEffect.destroy();
    this.sessionEndpointsEffect.destroy();
  }
}
