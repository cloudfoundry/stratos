import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { EndpointsDataService, GeneralEntityAppState, PermissionValues } from '@stratosui/store';
import { Observable, defer, from } from 'rxjs';
import { map } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../cf-types';
import {
  getCurrentUserCFEndpointHasScope,
  getCurrentUserCFEndpointRolesState,
  getCurrentUserCFGlobalState,
} from '../store/selectors/cf-current-user-role.selectors';
import { ICfRolesState } from '../store/types/cf-current-user-roles.types';
import { CfScopeStrings } from './cf-user-permissions.types';

/**
 * Signal-native bridge over the cf-side `currentUserRoles` selectors and
 * the `connectedEndpoints` projection.
 *
 * `CfUserPermissionsChecker` previously injected `Store` directly to read
 * these selectors. Routing through this service moves the `Store`
 * dependency out of the checker so that component specs which only
 * transitively pull in `CurrentUserPermissionsService` (and never run a
 * permission check) don't need to provide `@ngrx/store` at all.
 *
 * Wave 2 (W36-B): the connected-CF-endpoint enumeration now reads from
 * {@link EndpointsDataService} signals rather than
 * `connectedEndpointsSelector`. The observable surface is preserved for
 * the existing rxjs-shaped checker pipelines.
 *
 * Returns `Observable<...>` rather than `Signal<...>` because the existing
 * checker pipelines (`combineLatest`, `switchMap`, `distinctUntilChanged`)
 * are observable-shaped and porting them piecewise would expand this
 * keystone slice well beyond its scope.
 */
@Injectable({ providedIn: 'root' })
export class CfCurrentUserRolesSignalService {
  private store = inject<Store<GeneralEntityAppState>>(Store);
  private endpointsService = inject(EndpointsDataService);

  /** Whether the current user has the named scope on the given CF endpoint. */
  cfEndpointHasScope$(endpointGuid: string, scope: CfScopeStrings): Observable<boolean> {
    return this.store.select(getCurrentUserCFEndpointHasScope(endpointGuid, scope));
  }

  /** Whether the current user has the named global CF role on the endpoint. */
  cfGlobalState$(endpointGuid: string, permission: PermissionValues): Observable<boolean> {
    return this.store.select(getCurrentUserCFGlobalState(endpointGuid, permission));
  }

  /** Full per-endpoint CF roles slice (orgs/spaces/global). */
  cfEndpointRolesState$(endpointGuid: string): Observable<ICfRolesState> {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid));
  }

  /** GUIDs of every connected CF endpoint. */
  connectedCfEndpointGuids$(): Observable<string[]> {
    return defer(() => from(this.endpointsService.whenReady())).pipe(
      map(() =>
        Array.from(this.endpointsService.endpoints().values())
          .filter(e => e.cnsi_type === CF_ENDPOINT_TYPE && e.connectionStatus === 'connected')
          .map(endpoint => endpoint.guid)
      )
    );
  }
}
