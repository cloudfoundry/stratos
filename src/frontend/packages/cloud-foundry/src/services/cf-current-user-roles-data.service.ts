import { Injectable, Signal, computed, inject } from '@angular/core';
import {
  CurrentUserRolesDataService,
  PermissionValues,
} from '@stratosui/store';
import { Observable, distinctUntilChanged, map, shareReplay } from 'rxjs';

import { APIResource } from '../../../store/src/types/api.types';
import { CfUserRelationTypes } from '../actions/permissions.actions';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import {
  IAllCfRolesState,
  ICfRolesState,
  IGlobalRolesState,
} from '../store/types/cf-current-user-roles.types';
import { CfScopeStrings } from '../user-permissions/cf-user-permissions.types';
import {
  applyCfRoleChange,
  applyCfUserRelations,
  CfRoleCacheChange,
  CfRolesRequestStage,
  propagateCfConnectedAdmin,
  propagateCfSessionAdmin,
  registerCfEndpoint,
  removeCfEndpoint,
  removeCfOrg,
  removeCfSpace,
  setCfRequestState,
} from './cf-roles-state.helpers';

/** Minimal endpoint shape the session/connect admin-propagation transforms read. */
interface CfRolesEndpoint {
  guid: string;
  user?: { scopes?: string[] } | null;
}

/**
 * W36-C Wave 2 signal-native facade over the cf-side
 * `currentUserRoles.endpoints[CF_ENDPOINT_TYPE]` slice.
 *
 * Delegates the single store bridge to {@link CurrentUserRolesDataService}
 * (in the store package) and projects the cf-specific subtree —
 * `state.currentUserRoles.endpoints['cf']` — into per-endpoint signals.
 *
 * Mirrors the pattern from the W36-C Wave 1 `AuthDataService`:
 *   - signal-out for new consumers
 *   - parametric `*$` observable getters preserved so the legacy
 *     rxjs-shaped pipelines in {@link CfUserPermissionsChecker} keep
 *     compiling unchanged through the facade in
 *     {@link CfCurrentUserRolesSignalService}
 *
 * Per-endpoint reads choose a `Signal<...>` factory (returned per-guid)
 * rather than a `Signal<Map<guid, ...>>` aggregate because the consumer
 * pipelines already shape by endpoint guid and per-guid memoisation
 * matches the legacy `compose(...)` selector behaviour.
 */
@Injectable({ providedIn: 'root' })
export class CfCurrentUserRolesDataService {
  private rolesData = inject(CurrentUserRolesDataService);

  // ---- writes -------------------------------------------------------------
  //
  // Commit CF role transforms into the single source of truth via the
  // store package's CF-agnostic `updateEndpointRoles` seam. These replace the
  // former `currentCfUserRolesReducer` dispatch surface — every CF roles writer
  // (endpoint lifecycle, the roles fetch, role mutations, org/space delete)
  // now calls these directly. The store package never sees CF role shapes.

  private update(updater: (prev: IAllCfRolesState) => IAllCfRolesState): void {
    this.rolesData.updateEndpointRoles<IAllCfRolesState>(
      CF_ENDPOINT_TYPE,
      prev => updater(prev ?? {}),
    );
  }

  /** Apply one relation bucket (org/space) returned by the roles fetch. */
  applyUserRelations(relationType: CfUserRelationTypes, endpointGuid: string, data: APIResource<any>[]): void {
    this.update(prev => applyCfUserRelations(prev, relationType, endpointGuid, data));
  }

  /** Roles fetch started for an endpoint. */
  setFetching(endpointGuid: string): void {
    this.update(prev => setCfRequestState(prev, endpointGuid, CfRolesRequestStage.START));
  }

  /** Roles fetch succeeded for an endpoint. */
  setFetched(endpointGuid: string): void {
    this.update(prev => setCfRequestState(prev, endpointGuid, CfRolesRequestStage.SUCCESS));
  }

  /** Roles fetch failed for an endpoint. */
  setFailed(endpointGuid: string): void {
    this.update(prev => setCfRequestState(prev, endpointGuid, CfRolesRequestStage.FAILURE));
  }

  /** Propagate admin scopes from verified-session CF endpoints. */
  propagateSessionAdmin(cfEndpoints: CfRolesEndpoint[]): void {
    this.update(prev => propagateCfSessionAdmin(prev, cfEndpoints));
  }

  /** Propagate admin scopes for a newly-connected CF endpoint. */
  propagateConnectedAdmin(guid: string, user: CfRolesEndpoint['user']): void {
    this.update(prev => propagateCfConnectedAdmin(prev, guid, user));
  }

  /** Seed a default role row for a newly-registered CF endpoint. */
  registerEndpoint(guid: string): void {
    this.update(prev => registerCfEndpoint(prev, guid));
  }

  /** Drop a removed CF endpoint's role row. */
  removeEndpoint(guid: string): void {
    this.update(prev => removeCfEndpoint(prev, guid));
  }

  /** Drop a deleted org's role row. */
  removeOrg(endpointGuid: string, orgGuid: string): void {
    this.update(prev => removeCfOrg(prev, endpointGuid, orgGuid));
  }

  /** Drop a deleted space's role row + prune it from the org. */
  removeSpace(endpointGuid: string, spaceGuid: string): void {
    this.update(prev => removeCfSpace(prev, endpointGuid, spaceGuid));
  }

  /** Apply an add/remove of a single role for the connected user. */
  applyRoleChange(change: CfRoleCacheChange, isAdd: boolean): void {
    this.update(prev => applyCfRoleChange(prev, change, isAdd));
  }

  // ---- reads --------------------------------------------------------------

  /** All cf endpoint role state — keyed by endpoint guid. */
  readonly cfRolesState: Signal<IAllCfRolesState | undefined> = computed(
    () => this.rolesData.state()?.endpoints?.[CF_ENDPOINT_TYPE] as IAllCfRolesState | undefined,
  );

  /** Cf endpoint role state for a single endpoint guid. `null` until populated. */
  cfEndpointRolesState(endpointGuid: string): Signal<ICfRolesState | null> {
    return computed(() => {
      const all = this.cfRolesState();
      return all ? (all[endpointGuid] ?? null) : null;
    });
  }

  /** Cf global role state for a single endpoint guid. `null` until populated. */
  cfGlobalRolesState(endpointGuid: string): Signal<IGlobalRolesState | null> {
    return computed(() => this.cfEndpointRolesState(endpointGuid)()?.global ?? null);
  }

  /** Per-(endpoint, role) boolean — replaces `getCurrentUserCFGlobalState`. */
  cfGlobalState(endpointGuid: string, permission: PermissionValues): Signal<boolean> {
    return computed(() => {
      const global = this.cfGlobalRolesState(endpointGuid)() as Record<string, any> | null;
      return global ? !!global[permission] : false;
    });
  }

  /** Per-(endpoint, scope) boolean — replaces `getCurrentUserCFEndpointHasScope`. */
  cfEndpointHasScope(endpointGuid: string, scope: CfScopeStrings | string): Signal<boolean> {
    return computed(() => {
      const scopes = this.cfGlobalRolesState(endpointGuid)()?.scopes;
      return !!scopes?.includes(scope as string);
    });
  }

  // ---- observable surface (preserved for legacy checker pipelines) -------

  // Memoize per-endpoint observables so N directive instances on a page
  // (e.g. edit + delete + restart + restage on the app-action-bar; create-
  // space / edit-space on cf-org-spaces) share one map+distinctUntilChanged
  // pipe instead of building N redundant ones. The underlying state$ is
  // already a multicast store observable so the pipe rebuild was the only
  // duplicated work, but on pages with several gated buttons the count
  // adds up — visible as a subtle pause when navigating to a fresh CF
  // page before any of the buttons appear.
  private readonly _endpointRolesState$ = new Map<string, Observable<ICfRolesState>>();

  cfEndpointRolesState$(endpointGuid: string): Observable<ICfRolesState> {
    const cached = this._endpointRolesState$.get(endpointGuid);
    if (cached) {
      return cached;
    }
    const obs$ = this.rolesData.state$.pipe(
      map(state => {
        const all = state?.endpoints?.[CF_ENDPOINT_TYPE] as IAllCfRolesState | undefined;
        return (all ? all[endpointGuid] : null) as ICfRolesState;
      }),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this._endpointRolesState$.set(endpointGuid, obs$);
    return obs$;
  }

  cfGlobalState$(endpointGuid: string, permission: PermissionValues): Observable<boolean> {
    return this.rolesData.state$.pipe(
      map(state => {
        const all = state?.endpoints?.[CF_ENDPOINT_TYPE] as IAllCfRolesState | undefined;
        const global = all?.[endpointGuid]?.global as Record<string, any> | undefined;
        return global ? !!global[permission] : false;
      }),
      distinctUntilChanged(),
    );
  }

  cfEndpointHasScope$(endpointGuid: string, scope: CfScopeStrings | string): Observable<boolean> {
    return this.rolesData.state$.pipe(
      map(state => {
        const all = state?.endpoints?.[CF_ENDPOINT_TYPE] as IAllCfRolesState | undefined;
        const scopes = all?.[endpointGuid]?.global?.scopes;
        return !!scopes?.includes(scope as string);
      }),
      distinctUntilChanged(),
    );
  }

  /**
   * Space guids within an org where the connected user has the given space role,
   * or `'all'` when role state is unknown (no endpoint/org row) — replaces the
   * `getSpacesFromOrgWithRole` selector. `'all'` lets callers fall back to the
   * full space list (the legacy selector's sentinel).
   */
  spacesWithRoleInOrg$(endpointGuid: string, orgGuid: string, role: string): Observable<string[] | 'all'> {
    return this.cfEndpointRolesState$(endpointGuid).pipe(
      map(state => {
        if (!state) {
          return 'all' as const;
        }
        const org = state.organizations[orgGuid];
        if (!org) {
          return 'all' as const;
        }
        return org.spaceGuids.reduce((array: string[], spaceGuid: string) => {
          const space = state.spaces[spaceGuid];
          if (space && (space as Record<string, any>)[role]) {
            array.push(spaceGuid);
          }
          return array;
        }, []);
      }),
      distinctUntilChanged(),
    );
  }
}
