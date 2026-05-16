import { Injectable, Signal, computed, inject } from '@angular/core';
import {
  CurrentUserRolesDataService,
  PermissionValues,
} from '@stratosui/store';
import { Observable, distinctUntilChanged, map } from 'rxjs';

import { CF_ENDPOINT_TYPE } from '../cf-types';
import {
  IAllCfRolesState,
  ICfRolesState,
  IGlobalRolesState,
} from '../store/types/cf-current-user-roles.types';
import { CfScopeStrings } from '../user-permissions/cf-user-permissions.types';

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

  cfEndpointRolesState$(endpointGuid: string): Observable<ICfRolesState> {
    return this.rolesData.state$.pipe(
      map(state => {
        const all = state?.endpoints?.[CF_ENDPOINT_TYPE] as IAllCfRolesState | undefined;
        return (all ? all[endpointGuid] : null) as ICfRolesState;
      }),
      distinctUntilChanged(),
    );
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
}
