import { Injectable, inject } from '@angular/core';
import { EndpointsDataService, PermissionValues } from '@stratosui/store';
import { Observable, defer, from } from 'rxjs';
import { map } from 'rxjs/operators';

import { CfCurrentUserRolesDataService } from '../services/cf-current-user-roles-data.service';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { ICfRolesState } from '../store/types/cf-current-user-roles.types';
import { CfScopeStrings } from './cf-user-permissions.types';

/**
 * W36-C Wave 2 — thin facade over {@link CfCurrentUserRolesDataService}.
 *
 * Preserves the observable surface `CfUserPermissionsChecker` was written
 * against. The single `Store` bridge moved into
 * `CurrentUserRolesDataService` (in the store package); this service no
 * longer touches `Store`.
 *
 * The connected-CF-endpoint enumeration still reads from
 * {@link EndpointsDataService} signals (since W36-B Wave 2), preserved
 * here verbatim so the pipeline shape is unchanged.
 *
 * Returns `Observable<...>` rather than `Signal<...>` because the existing
 * checker pipelines (`combineLatest`, `switchMap`, `distinctUntilChanged`)
 * are observable-shaped and porting them piecewise would expand this
 * keystone slice well beyond its scope. New code should inject
 * {@link CfCurrentUserRolesDataService} directly for signal-shaped APIs.
 */
@Injectable({ providedIn: 'root' })
export class CfCurrentUserRolesSignalService {
  private rolesData = inject(CfCurrentUserRolesDataService);
  private endpointsService = inject(EndpointsDataService);

  /** Whether the current user has the named scope on the given CF endpoint. */
  cfEndpointHasScope$(endpointGuid: string, scope: CfScopeStrings): Observable<boolean> {
    return this.rolesData.cfEndpointHasScope$(endpointGuid, scope);
  }

  /** Whether the current user has the named global CF role on the endpoint. */
  cfGlobalState$(endpointGuid: string, permission: PermissionValues): Observable<boolean> {
    return this.rolesData.cfGlobalState$(endpointGuid, permission);
  }

  /** Full per-endpoint CF roles slice (orgs/spaces/global). */
  cfEndpointRolesState$(endpointGuid: string): Observable<ICfRolesState> {
    return this.rolesData.cfEndpointRolesState$(endpointGuid);
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
