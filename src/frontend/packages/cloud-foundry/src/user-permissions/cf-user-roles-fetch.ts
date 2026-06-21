import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError, map, share, take } from 'rxjs/operators';

import { APIResource } from '@stratosui/store';

import { CfUserRelationTypes } from '../actions/permissions.actions';
import { CfCurrentUserRolesDataService } from '../services/cf-current-user-roles-data.service';
import { getFeatureFlagsSource } from './feature-flags-cache';

/**
 * Wire shape returned by GET /pp/v1/cf/current-user-roles/:cnsiGuid
 * (handler: getNativeCurrentUserRoles). Each bucket key matches a
 * {@link CfUserRelationTypes} enum value; every canonical key is present
 * (empty buckets serialize as `[]`, never absent). Entry shape mirrors the
 * legacy V2 envelope so the role transforms (which read `metadata.guid` for org
 * buckets and additionally `entity.organization_guid` for space buckets) need
 * zero change.
 */
export interface CfCurrentUserRolesResponse {
  buckets: {
    [relationType: string]: APIResource<{ organization_guid?: string }>[];
  };
}

/** Endpoint shape the fetch reads: guid + connected user (for the admin shortcut). */
export interface CfRolesFetchEndpoint {
  guid: string;
  user?: { admin?: boolean } | null;
}

/**
 * Single-fetch replacement for the legacy 8-fanout permission fetch.
 *
 * Hits GET /pp/v1/cf/current-user-roles/{endpointGuid} once and applies each of
 * the 8 returned buckets to the signal source of truth via the CF roles facade
 * (replaces the former per-bucket `GetCurrentCfUserRelationsComplete` dispatch).
 * Missing buckets default to `[]` so a now-empty relation clears prior roles.
 * On HTTP error: swallow + return false so the caller can mark the endpoint
 * failed.
 */
export function fetchCfCurrentUserRoles(
  cfRoles: CfCurrentUserRolesDataService,
  endpointGuid: string,
  httpClient: HttpClient,
): Observable<boolean> {
  return httpClient.get<CfCurrentUserRolesResponse>(`pp/v1/cf/current-user-roles/${endpointGuid}`).pipe(
    map(response => {
      const buckets = response?.buckets ?? {};
      Object.values(CfUserRelationTypes).forEach((relationType: CfUserRelationTypes) => {
        cfRoles.applyUserRelations(relationType, endpointGuid, buckets[relationType] ?? []);
      });
      return true;
    }),
    take(1),
    catchError(err => {
      console.warn('Failed to fetch current user permissions for a cf: ', err);
      return of(false);
    }),
    share(),
  );
}

/**
 * Fetch + commit the connected user's CF roles for a single endpoint, driving
 * the per-endpoint request state. Admins skip the role fetch entirely (they can
 * do everything) and are marked initialised. Replaces the orchestration the
 * legacy `cfUserRolesFetch` catalog plug-in performed via `GetCfUserRelations`
 * dispatches.
 */
export async function fetchCfUserRolesForEndpoint(
  cfRoles: CfCurrentUserRolesDataService,
  httpClient: HttpClient,
  endpoint: CfRolesFetchEndpoint,
): Promise<boolean> {
  if (endpoint.user?.admin) {
    // Admins need no per-org/space roles — just mark the endpoint initialised.
    cfRoles.setFetched(endpoint.guid);
    return true;
  }
  cfRoles.setFetching(endpoint.guid);
  try {
    // Prime the shared feature-flags cache so downstream permission checkers
    // read flags from the same CnsiFeatureFlagsSource.
    const ffSource = getFeatureFlagsSource(endpoint.guid, httpClient);
    const ffOk = await ffSource.load().then(() => true).catch(() => false);
    const rolesOk = await firstValueFrom(fetchCfCurrentUserRoles(cfRoles, endpoint.guid, httpClient));
    const ok = ffOk && rolesOk;
    if (ok) {
      cfRoles.setFetched(endpoint.guid);
    } else {
      cfRoles.setFailed(endpoint.guid);
    }
    return ok;
  } catch (err) {
    console.warn('Failed to fetch current user permissions for a cf: ', err);
    cfRoles.setFailed(endpoint.guid);
    return false;
  }
}
