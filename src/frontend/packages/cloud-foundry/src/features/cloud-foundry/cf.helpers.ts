import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { getCFEntityKey } from '../../../../cloud-foundry/src/cf-entity-helpers';
import { applicationEntityType } from '../../../../cloud-foundry/src/cf-entity-types';
import {
  getCurrentUserCFEndpointRolesState,
} from '../../../../cloud-foundry/src/store/selectors/cf-current-user-role.selectors';
import { ICfRolesState } from '../../../../cloud-foundry/src/store/types/cf-current-user-roles.types';
import {
  CfUser,
  CfUserRoleParams,
  OrgUserRoleNames,
  SpaceUserRoleNames,
  UserRoleInOrg,
  UserRoleInSpace,
} from '../../../../cloud-foundry/src/store/types/user.types';
import { UserRoleLabels } from '../../../../cloud-foundry/src/store/types/users-roles.types';
import {
  CurrentUserPermissions,
  PermissionConfig,
  PermissionTypes,
} from '../../../../core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../core/src/core/current-user-permissions.service';
import { getIdFromRoute, pathGet } from '../../../../core/src/core/utils.service';
import {
  extractActualListEntity,
} from '../../../../core/src/shared/components/list/data-sources-controllers/local-filtering-sorting';
import { SetClientFilter } from '../../../../store/src/actions/pagination.actions';
import { RouterNav } from '../../../../store/src/actions/router.actions';
import { AppState } from '../../../../store/src/app-state';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { endpointEntitiesSelector } from '../../../../store/src/selectors/endpoint.selectors';
import { selectPaginationState } from '../../../../store/src/selectors/pagination.selectors';
import { APIResource } from '../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { PaginatedAction, PaginationEntityState } from '../../../../store/src/types/pagination.types';
import { IServiceInstance, IUserProvidedServiceInstance } from '../../cf-api-svc.types';
import { CFFeatureFlagTypes, ISpace } from '../../cf-api.types';
import { cfEntityFactory } from '../../cf-entity-factory';
import { CFEntityConfig } from '../../cf-types';
import { ActiveRouteCfCell, ActiveRouteCfOrgSpace } from './cf-page.types';

export interface IUserRole<T> {
  string: string;
  key: T;
}

export function getOrgRolesString(userRolesInOrg: UserRoleInOrg): string {
  let roles = null;
  if (userRolesInOrg[OrgUserRoleNames.MANAGER]) {
    roles = UserRoleLabels.org.short[OrgUserRoleNames.MANAGER];
  }
  if (userRolesInOrg[OrgUserRoleNames.BILLING_MANAGERS]) {
    roles = assignRole(roles, UserRoleLabels.org.short[OrgUserRoleNames.BILLING_MANAGERS]);
  }
  if (userRolesInOrg[OrgUserRoleNames.AUDITOR]) {
    roles = assignRole(roles, UserRoleLabels.org.short[OrgUserRoleNames.AUDITOR]);

  }
  if (userRolesInOrg[OrgUserRoleNames.USER] && !userRolesInOrg[OrgUserRoleNames.MANAGER]) {
    roles = assignRole(roles, UserRoleLabels.org.short[OrgUserRoleNames.USER]);
  }

  return roles ? roles : 'None';
}
export function getSpaceRolesString(userRolesInSpace: UserRoleInSpace): string {
  let roles = null;
  if (userRolesInSpace[SpaceUserRoleNames.MANAGER]) {
    roles = UserRoleLabels.space.short[SpaceUserRoleNames.MANAGER];
  }
  if (userRolesInSpace[SpaceUserRoleNames.AUDITOR]) {
    roles = assignRole(roles, UserRoleLabels.space.short[SpaceUserRoleNames.AUDITOR]);

  }
  if (userRolesInSpace[SpaceUserRoleNames.DEVELOPER]) {
    roles = assignRole(roles, UserRoleLabels.space.short[SpaceUserRoleNames.DEVELOPER]);
  }

  return roles ? roles : 'None';
}

export function getOrgRoles(userRolesInOrg: UserRoleInOrg): IUserRole<OrgUserRoleNames>[] {
  const roles = [];
  if (userRolesInOrg[OrgUserRoleNames.MANAGER]) {
    roles.push({
      string: UserRoleLabels.org.short[OrgUserRoleNames.MANAGER],
      key: OrgUserRoleNames.MANAGER
    });
  }
  if (userRolesInOrg[OrgUserRoleNames.BILLING_MANAGERS]) {
    roles.push({
      string: UserRoleLabels.org.short[OrgUserRoleNames.BILLING_MANAGERS],
      key: OrgUserRoleNames.BILLING_MANAGERS
    });
  }
  if (userRolesInOrg[OrgUserRoleNames.AUDITOR]) {
    roles.push({
      string: UserRoleLabels.org.short[OrgUserRoleNames.AUDITOR],
      key: OrgUserRoleNames.AUDITOR
    });
  }
  if (userRolesInOrg[OrgUserRoleNames.USER]) {
    roles.push({
      string: UserRoleLabels.org.short[OrgUserRoleNames.USER],
      key: OrgUserRoleNames.USER
    });
  }
  return roles;
}

export function getSpaceRoles(userRolesInSpace: UserRoleInSpace): IUserRole<SpaceUserRoleNames>[] {
  const roles = [];
  if (userRolesInSpace[SpaceUserRoleNames.MANAGER]) {
    roles.push({
      string: UserRoleLabels.space.short[SpaceUserRoleNames.MANAGER],
      key: SpaceUserRoleNames.MANAGER
    });
  }
  if (userRolesInSpace[SpaceUserRoleNames.AUDITOR]) {
    roles.push({
      string: UserRoleLabels.space.short[SpaceUserRoleNames.AUDITOR],
      key: SpaceUserRoleNames.AUDITOR
    });
  }
  if (userRolesInSpace[SpaceUserRoleNames.DEVELOPER]) {
    roles.push({
      string: UserRoleLabels.space.short[SpaceUserRoleNames.DEVELOPER],
      key: SpaceUserRoleNames.DEVELOPER
    });
  }
  return roles;
}

function assignRole(currentRoles: string, role: string) {
  const newRoles = currentRoles ? `${currentRoles}, ${role}` : role;
  return newRoles;
}

export function isOrgManager(user: CfUser, guid: string): boolean {
  return hasRole(user, guid, CfUserRoleParams.MANAGED_ORGS);
}

export function isOrgBillingManager(user: CfUser, guid: string): boolean {
  return hasRole(user, guid, CfUserRoleParams.BILLING_MANAGER_ORGS);
}

export function isOrgAuditor(user: CfUser, guid: string): boolean {
  return hasRole(user, guid, CfUserRoleParams.AUDITED_ORGS);
}

export function isOrgUser(user: CfUser, guid: string): boolean {
  return hasRole(user, guid, CfUserRoleParams.ORGANIZATIONS);
}

export function isSpaceManager(user: CfUser, spaceGuid: string): boolean {
  return hasRole(user, spaceGuid, CfUserRoleParams.MANAGED_SPACES);
}

export function isSpaceAuditor(user: CfUser, spaceGuid: string): boolean {
  return hasRole(user, spaceGuid, CfUserRoleParams.AUDITED_SPACES);
}

export function isSpaceDeveloper(user: CfUser, spaceGuid: string): boolean {
  return hasRole(user, spaceGuid, CfUserRoleParams.SPACES);
}

export function hasRoleWithinOrg(user: CfUser, orgGuid: string): boolean {
  return isOrgManager(user, orgGuid) ||
    isOrgBillingManager(user, orgGuid) ||
    isOrgAuditor(user, orgGuid) ||
    isOrgUser(user, orgGuid);
}

export function hasRoleWithinSpace(user: CfUser, spaceGuid: string): boolean {
  return isSpaceManager(user, spaceGuid) ||
    isSpaceAuditor(user, spaceGuid) ||
    isSpaceDeveloper(user, spaceGuid);
}

export function hasRoleWithin(user: CfUser, orgGuid?: string, spaceGuid?: string): boolean {
  return hasRoleWithinOrg(user, orgGuid) || hasRoleWithinSpace(user, spaceGuid);
}

export function hasSpaceRoleWithinOrg(user: CfUser, orgGuid: string): boolean {
  const roles = [
    CfUserRoleParams.MANAGED_SPACES,
    CfUserRoleParams.AUDITED_SPACES,
    CfUserRoleParams.SPACES
  ];
  const orgSpaces = [];

  for (const role of roles) {
    const roleSpaces = user[role] as APIResource<ISpace>[];

    orgSpaces.push(...roleSpaces.filter((space) => {
      return space.entity.organization_guid === orgGuid;
    }));
  }

  return orgSpaces.some((space) => hasRoleWithinSpace(user, space.metadata.guid));
}

function hasRole(user: CfUser, guid: string, roleType: string) {
  if (user[roleType]) {
    const roles = user[roleType] as APIResource[];
    return !!roles.find(o => o ? o.metadata.guid === guid : false);
  }
  return false;
}

export function getActiveRouteCfOrgSpace(activatedRoute: ActivatedRoute) {
  return ({
    cfGuid: getIdFromRoute(activatedRoute, 'endpointId'),
    orgGuid: getIdFromRoute(activatedRoute, 'orgId'),
    spaceGuid: getIdFromRoute(activatedRoute, 'spaceId'),
  });
}

export function getActiveRouteCfCell(activatedRoute: ActivatedRoute) {
  return ({
    cfGuid: getIdFromRoute(activatedRoute, 'endpointId'),
    cellId: getIdFromRoute(activatedRoute, 'cellId'),
  });
}

export const getActiveRouteCfOrgSpaceProvider = {
  provide: ActiveRouteCfOrgSpace,
  useFactory: getActiveRouteCfOrgSpace,
  deps: [
    ActivatedRoute,
  ]
};

export const getActiveRouteCfCellProvider = {
  provide: ActiveRouteCfCell,
  useFactory: getActiveRouteCfCell,
  deps: [
    ActivatedRoute,
  ]
};

export function goToAppWall(store: Store<CFAppState>, cfGuid: string, orgGuid?: string, spaceGuid?: string) {
  const appWallPagKey = 'applicationWall';
  const entityKey = getCFEntityKey(applicationEntityType);
  store.dispatch(new SetClientFilter(new CFEntityConfig(applicationEntityType), appWallPagKey,
    {
      string: '',
      items: {
        cf: cfGuid,
        org: orgGuid,
        space: spaceGuid
      }
    }
  ));
  store.select(selectPaginationState(entityKey, appWallPagKey)).pipe(
    filter((state: PaginationEntityState) => {
      const items = pathGet('clientPagination.filter.items', state);
      return items ? items.cf === cfGuid && items.org === orgGuid && items.space === spaceGuid : false;
    }),
    first(),
    tap(() => {
      store.dispatch(new RouterNav({ path: ['applications'] }));
    })
  ).subscribe();
}

export function canUpdateOrgSpaceRoles(
  perms: CurrentUserPermissionsService,
  cfGuid: string,
  orgGuid?: string,
  spaceGuid?: string): Observable<boolean> {
  return combineLatest(
    perms.can(CurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, cfGuid, orgGuid),
    perms.can(CurrentUserPermissions.SPACE_CHANGE_ROLES, cfGuid, orgGuid, spaceGuid)
  ).pipe(
    map((checks: boolean[]) => checks.some(check => check))
  );
}

export function canUpdateOrgRoles(
  perms: CurrentUserPermissionsService,
  cfGuid: string,
  orgGuid?: string): Observable<boolean> {
  return perms.can(CurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, cfGuid, orgGuid);
}

export function waitForCFPermissions(store: Store<AppState>, cfGuid: string): Observable<ICfRolesState> {
  return store.select<ICfRolesState>(getCurrentUserCFEndpointRolesState(cfGuid)).pipe(
    filter(cf => cf && cf.state.initialised),
    first(),
    publishReplay(1),
    refCount(),
  );
}

export function selectConnectedCfs(store: Store<AppState>): Observable<EndpointModel[]> {
  return store.select(endpointEntitiesSelector).pipe(
    map(endpoints => Object.values(endpoints)),
    map(endpoints => endpoints.filter(endpoint => endpoint.cnsi_type === 'cf' && endpoint.connectionStatus === 'connected')),
  );
}

export function haveMultiConnectedCfs(store: Store<AppState>): Observable<boolean> {
  return selectConnectedCfs(store).pipe(
    map(connectedCfs => connectedCfs.length > 1)
  );
}

export function filterEntitiesByGuid<T>(guid: string, array?: Array<APIResource<T>>): Array<APIResource<T>> {
  return array ? array.filter(entity => entity.metadata.guid === guid) : null;
}

export function createFetchTotalResultsPagKey(standardActionKey: string): string {
  return standardActionKey + '-totalResults';
}

export function fetchTotalResults(
  action: PaginatedAction,
  store: Store<AppState>,
  paginationMonitorFactory: PaginationMonitorFactory
): Observable<number> {
  const newAction = {
    ...action,
    paginationKey: createFetchTotalResultsPagKey(action.paginationKey),
    flattenPagination: false,
    includeRelations: []
  };
  newAction.initialParams['results-per-page'] = 1;

  const pagObs = getPaginationObservables({
    store,
    action: newAction,
    paginationMonitor: paginationMonitorFactory.create(
      newAction.paginationKey,
      cfEntityFactory(newAction.entityType),
      newAction.flattenPagination
    )
  }, newAction.flattenPagination);

  return combineLatest(
    pagObs.entities$, // Ensure the request is made by sub'ing to the entities observable
    pagObs.pagination$
  ).pipe(
    map(([, pagination]) => pagination),
    filter(pagination => !!pagination && !!pagination.pageRequests && !!pagination.pageRequests[1] && !pagination.pageRequests[1].busy),
    first(),
    map(pagination => pagination.totalResults)
  );
}

export const cfOrgSpaceFilter = (entities: APIResource[], paginationState: PaginationEntityState) => {
  // Filtering is done remotely when maxedResults are hit (see `setMultiFilter`)
  if (!!paginationState.maxedState.isMaxedMode && !paginationState.maxedState.ignoreMaxed) {
    return entities;
  }

  // Filter by cf/org/space
  const cfGuid = paginationState.clientPagination.filter.items.cf;
  const orgGuid = paginationState.clientPagination.filter.items.org;
  const spaceGuid = paginationState.clientPagination.filter.items.space;
  return !cfGuid && !orgGuid && !spaceGuid ? entities : entities.filter(e => {
    e = extractActualListEntity(e);
    const validCF = !(cfGuid && cfGuid !== e.entity.cfGuid);
    const validOrg = !(orgGuid && orgGuid !== e.entity.space.entity.organization_guid);
    const validSpace = !(spaceGuid && spaceGuid !== e.entity.space_guid);
    return validCF && validOrg && validSpace;
  });
};

export function createCfOrgSpaceSteppersUrl(
  cfGuid: string,
  stepperPath: string = `/users/manage`,
  orgGuid?: string,
  spaceGuid?: string,
): string {
  let route = `/cloud-foundry/${cfGuid}`;
  if (orgGuid) {
    route += `/organizations/${orgGuid}`;
    if (spaceGuid) {
      route += `/spaces/${spaceGuid}`;
    }
  }
  route += stepperPath;
  return route;
}

export function createCfOrgSpaceUserRemovalUrl(
  cfGuid: string,
  orgGuid?: string,
  spaceGuid?: string,
): string {
  let route = `/cloud-foundry/${cfGuid}`;
  if (orgGuid) {
    route += `/organizations/${orgGuid}`;
    if (spaceGuid) {
      route += `/spaces/${spaceGuid}`;
    }
  }
  route += '/users/remove';

  return route;
}

export function isServiceInstance(obj: any): IServiceInstance {
  return !!obj && !!obj.service_plan_url ? obj as IServiceInstance : null;
}

export function isUserProvidedServiceInstance(obj: any): IUserProvidedServiceInstance {
  return !!obj && (obj.route_service_url !== null && obj.route_service_url !== undefined) ? obj as IUserProvidedServiceInstance : null;
}

export function someFeatureFlags(
  ff: CFFeatureFlagTypes[],
  cfGuid: string,
  store: Store<AppState>,
  userPerms: CurrentUserPermissionsService,
): Observable<boolean> {
  return waitForCFPermissions(store, cfGuid).pipe(
    switchMap(() => combineLatest(ff.map(flag => {
      const permConfig = new PermissionConfig(PermissionTypes.FEATURE_FLAG, flag);
      return userPerms.can(permConfig, cfGuid);
    }))),
    map(results => results.some(result => !!result))
  );
}
