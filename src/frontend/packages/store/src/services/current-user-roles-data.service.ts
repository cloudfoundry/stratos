import { Injectable, Signal, WritableSignal, computed, signal } from '@angular/core';

import { SessionUser } from '../types/auth.types';
import {
  ICurrentUserRolesState,
  IStratosRolesState,
  PermissionValues,
  RolesRequestState,
  getDefaultRolesRequestState,
} from '../types/current-user-roles.types';
import { UserScopeStrings } from '../types/endpoint.types';

const getDefaultState = (): ICurrentUserRolesState => ({
  internal: {
    isAdmin: false,
    scopes: [] as UserScopeStrings[],
  },
  endpoints: {},
  state: getDefaultRolesRequestState(),
});

/**
 * Signal-native source of truth for the current user's roles — stratos-global
 * `internal` admin/scopes plus the per-endpoint role subtrees (e.g. the CF
 * roles under `endpoints[CF_ENDPOINT_TYPE]`).
 *
 * Replaces the `currentUserRoles` ngrx slice + its reducer/effect/selectors
 * (favorites/roles island, Wave 2). This service no longer bridges a Store
 * slice — it OWNS the state in a {@link WritableSignal} and exposes write
 * methods that every roles writer calls directly:
 *   - stratos: {@link applySessionScopes} + request-state transitions
 *   - per-endpoint: {@link updateEndpointRoles} — a CF-agnostic write seam the
 *     cloud-foundry package's roles data service uses to commit its own transforms
 *     (the store package must not depend on CF role types). This replaces the
 *     entity-catalog `getAllCurrentUserReducers` composition.
 *
 * Reads are signals; the permission checkers build their computeds on them.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserRolesDataService {
  /** The owned roles state. */
  private readonly _state: WritableSignal<ICurrentUserRolesState> = signal(getDefaultState());

  readonly state: Signal<ICurrentUserRolesState | undefined> = this._state.asReadonly();

  readonly stratos: Signal<IStratosRolesState | undefined> = computed(
    () => this._state().internal,
  );

  // ---- writes -------------------------------------------------------------

  /**
   * Apply the verified session user's internal admin flag + scopes. Replaces
   * the reducer's `CURRENT_USER_ROLES_SESSION_VERIFIED` case
   * (`applyInternalScopes`). No-op on internal roles when `user` is absent.
   */
  applySessionScopes(user: SessionUser | undefined): void {
    if (!user) {
      return;
    }
    this._state.update(s => ({
      ...s,
      internal: {
        ...s.internal,
        // The admin scope is configurable - so look at the flag from the backend
        isAdmin: user.admin,
        scopes: (user.scopes || []) as UserScopeStrings[],
      },
    }));
  }

  /** Global roles fetch started (replaces `GET_CURRENT_USER_RELATIONS`). */
  setStratosFetching(): void {
    this.patchRequestState({ fetching: true });
  }

  /** Global roles fetch succeeded (replaces `GET_CURRENT_USER_RELATIONS_SUCCESS`). */
  setStratosFetched(): void {
    this.patchRequestState({ initialised: true, fetching: false });
  }

  /** Global roles fetch failed (replaces `GET_CURRENT_USER_RELATIONS_FAILED`). */
  setStratosFailed(): void {
    this.patchRequestState({ fetching: false, error: true });
  }

  /**
   * CF-agnostic per-endpoint-type write seam. The cloud-foundry roles data
   * service supplies an `updater` that maps the previous role subtree to the next
   * one; the store package never needs to know the subtree's shape. Replaces the
   * entity-catalog `getAllCurrentUserReducers` per-endpoint composition.
   */
  updateEndpointRoles<T = any>(endpointType: string, updater: (prev: T | undefined) => T): void {
    this._state.update(s => ({
      ...s,
      endpoints: {
        ...s.endpoints,
        [endpointType]: updater(s.endpoints[endpointType] as T | undefined),
      },
    }));
  }

  private patchRequestState(patch: Partial<RolesRequestState>): void {
    this._state.update(s => ({
      ...s,
      state: { ...s.state, ...patch },
    }));
  }

  // ---- reads --------------------------------------------------------------

  /** Per-role boolean signal — replaces `getCurrentUserStratosRole(role)`. */
  stratosRole(role: PermissionValues): Signal<boolean> {
    return computed(() => {
      const internal = this._state().internal as Record<string, any> | undefined;
      if (!internal) {
        return false;
      }
      // Mirrors `selectCurrentUserStratosRoles`: scopes is handled separately.
      return !!internal[role];
    });
  }

  /** Per-scope boolean signal — replaces `getCurrentUserStratosHasScope(scope)`. */
  stratosHasScope(scope: UserScopeStrings | string): Signal<boolean> {
    return computed(() => {
      const scopes = this._state().internal?.scopes;
      return !!scopes?.includes(scope as UserScopeStrings);
    });
  }
}
