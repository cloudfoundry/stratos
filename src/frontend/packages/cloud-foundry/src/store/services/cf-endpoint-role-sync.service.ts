import { Injectable, OnDestroy, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  AuthDataService,
  CurrentUserRolesDataService,
  EndpointDisconnectCleanupService,
  EndpointsDataService,
} from '@stratosui/store';

import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { CfCurrentUserRolesDataService } from '../../services/cf-current-user-roles-data.service';
import { fetchCfUserRolesForEndpoint } from '../../user-permissions/cf-user-roles-fetch';

/**
 * CF role-state lifecycle + fetch wiring (favorites/roles island, Wave 2).
 *
 * Replaces the former ngrx-action listeners in `currentCfUserRolesReducer`
 * (REGISTER/CONNECT/DISCONNECT/SESSION) AND the catalog `userRolesFetch`
 * plug-in trigger (dashboard `GetCurrentUsersRelations` + the per-connect fetch
 * in `EndpointDisconnectCleanupService`). All CF role state now flows directly
 * into the signal source of truth via {@link CfCurrentUserRolesDataService}.
 *
 * Bootstrapped eagerly from `CloudFoundryStoreModule` so the signal effects
 * start observing before any user-driven mutation or the dashboard renders —
 * the roles fetch therefore fires as soon as connected CF endpoints appear
 * (≤ the legacy dashboard-load trigger, and also covers endpoints connected
 * after initial load, which the one-shot dashboard dispatch missed).
 */
@Injectable({ providedIn: 'root' })
export class CfEndpointRoleSyncService implements OnDestroy {
  private endpointsService = inject(EndpointsDataService);
  private cleanup = inject(EndpointDisconnectCleanupService);
  private authData = inject(AuthDataService);
  private cfRoles = inject(CfCurrentUserRolesDataService);
  private globalRoles = inject(CurrentUserRolesDataService);
  private http = inject(HttpClient);

  /** CF endpoint guids we've already seeded a role-state row for. */
  private seenCfGuids = new Set<string>();
  /** CF endpoint guids we've already fetched roles for (cleared on disconnect). */
  private fetchedCfGuids = new Set<string>();

  /** Roles fetches in flight across the current batch (drives the global request state). */
  private inFlight = 0;
  private batchFailed = false;

  /** Seed a default role row for each registered CF endpoint (legacy REGISTER_ENDPOINTS_SUCCESS). */
  private readonly registerEffect = effect(() => {
    const endpoints = this.endpointsService.endpoints();
    endpoints.forEach((ep, guid) => {
      if (ep.cnsi_type !== CF_ENDPOINT_TYPE) {
        return;
      }
      if (!this.seenCfGuids.has(guid)) {
        this.seenCfGuids.add(guid);
        this.cfRoles.registerEndpoint(guid);
      }
    });
    // Drop tracking for endpoints that disappeared (covers unregister).
    for (const tracked of Array.from(this.seenCfGuids)) {
      if (!endpoints.has(tracked)) {
        this.seenCfGuids.delete(tracked);
      }
    }
  });

  /**
   * Fetch the connected user's roles for each connected CF endpoint, once.
   * Replaces both the dashboard `GetCurrentUsersRelations` dispatch and the
   * per-connect fetch the store-package cleanup service used to drive via the
   * catalog plug-in. The fetch kickoff is deferred to a microtask so the
   * signal writes it performs happen outside this effect's reactive run.
   */
  private readonly fetchEffect = effect(() => {
    const endpoints = this.endpointsService.endpoints();
    const connected = Array.from(endpoints.values())
      .filter((ep): ep is typeof ep & { guid: string } =>
        ep.cnsi_type === CF_ENDPOINT_TYPE && ep.connectionStatus === 'connected' && !!ep.guid);

    const toFetch = connected.filter(ep => !this.fetchedCfGuids.has(ep.guid));
    toFetch.forEach(ep => this.fetchedCfGuids.add(ep.guid));
    if (toFetch.length) {
      queueMicrotask(() => toFetch.forEach(ep => void this.runFetch(ep)));
    }

    // Allow a reconnect to refetch: drop guids that are no longer connected.
    for (const tracked of Array.from(this.fetchedCfGuids)) {
      const ep = endpoints.get(tracked);
      if (!ep || ep.connectionStatus !== 'connected') {
        this.fetchedCfGuids.delete(tracked);
      }
    }
  });

  /**
   * Propagate CF admin permissions from verified-session endpoints (replaces
   * the auth slice's SESSION_VERIFIED reducer case). Fires once per verify.
   */
  private readonly sessionEndpointsEffect = effect(() => {
    const sessionData = this.authData.sessionData();
    if (sessionData?.endpoints) {
      this.cfRoles.propagateSessionAdmin(Object.values(sessionData.endpoints.cf || {}));
    }
  });

  constructor() {
    this.cleanup.registerConnectHandler(event => {
      if (event.type !== CF_ENDPOINT_TYPE) {
        return;
      }
      this.cfRoles.propagateConnectedAdmin(event.guid, event.user);
    });
    this.cleanup.registerDisconnectHandler(event => {
      if (event.type !== CF_ENDPOINT_TYPE) {
        return;
      }
      this.cfRoles.removeEndpoint(event.guid);
    });
  }

  private async runFetch(endpoint: { guid?: string, user?: { admin?: boolean } | null }): Promise<void> {
    if (!endpoint.guid) {
      return;
    }
    this.beginGlobalFetch();
    let ok = false;
    try {
      ok = await fetchCfUserRolesForEndpoint(this.cfRoles, this.http, { guid: endpoint.guid, user: endpoint.user });
    } finally {
      this.endGlobalFetch(ok);
    }
  }

  private beginGlobalFetch(): void {
    if (this.inFlight === 0) {
      this.batchFailed = false;
      this.globalRoles.setStratosFetching();
    }
    this.inFlight++;
  }

  private endGlobalFetch(ok: boolean): void {
    if (!ok) {
      this.batchFailed = true;
    }
    this.inFlight--;
    if (this.inFlight === 0) {
      if (this.batchFailed) {
        this.globalRoles.setStratosFailed();
      } else {
        this.globalRoles.setStratosFetched();
      }
    }
  }

  ngOnDestroy(): void {
    this.registerEffect.destroy();
    this.fetchEffect.destroy();
    this.sessionEndpointsEffect.destroy();
  }
}
