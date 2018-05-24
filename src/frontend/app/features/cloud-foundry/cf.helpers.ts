import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, first, tap } from 'rxjs/operators';

import { pathGet } from '../../core/utils.service';
import { SetClientFilter } from '../../store/actions/pagination.actions';
import { RouterNav } from '../../store/actions/router.actions';
import { AppState } from '../../store/app-state';
import { applicationSchemaKey } from '../../store/helpers/entity-factory';
import { selectPaginationState } from '../../store/selectors/pagination.selectors';
import { APIResource } from '../../store/types/api.types';
import { PaginationEntityState } from '../../store/types/pagination.types';
import { CfUser, OrgUserRoleNames, SpaceUserRoleNames, UserRoleInOrg, UserRoleInSpace } from '../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from './cf-page.types';
import { UserRoleLabels } from '../../store/types/users-roles.types';

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
  return hasRole(user, guid, 'managed_organizations');
}

export function isOrgBillingManager(user: CfUser, guid: string): boolean {
  return hasRole(user, guid, 'billing_managed_organizations');
}

export function isOrgAuditor(user: CfUser, guid: string): boolean {
  return hasRole(user, guid, 'audited_organizations');
}

export function isOrgUser(user: CfUser, guid: string): boolean {
  return hasRole(user, guid, 'organizations');
}

export function isSpaceManager(user: CfUser, spaceGuid: string): boolean {
  return hasRole(user, spaceGuid, 'managed_spaces');
}

export function isSpaceAuditor(user: CfUser, spaceGuid: string): boolean {
  return hasRole(user, spaceGuid, 'audited_spaces');
}

export function isSpaceDeveloper(user: CfUser, spaceGuid: string): boolean {
  return hasRole(user, spaceGuid, 'spaces');
}

function hasRole(user: CfUser, guid: string, roleType: string) {
  if (user[roleType]) {
    const roles = user[roleType] as APIResource[];
    return !!roles.find(o => o.metadata.guid === guid);
  }
  return false;
}

export const getRowMetadata = (entity: APIResource) => entity.metadata ? entity.metadata.guid : null;

export function getIdFromRoute(activatedRoute: ActivatedRoute, id: string) {
  if (activatedRoute.snapshot.params[id]) {
    return activatedRoute.snapshot.params[id];
  } else if (activatedRoute.parent) {
    return getIdFromRoute(activatedRoute.parent, id);
  }
  return null;
}

export function getActiveRouteCfOrgSpace(activatedRoute: ActivatedRoute) {
  return ({
    cfGuid: getIdFromRoute(activatedRoute, 'cfId'),
    orgGuid: getIdFromRoute(activatedRoute, 'orgId'),
    spaceGuid: getIdFromRoute(activatedRoute, 'spaceId')
  });
}

export const getActiveRouteCfOrgSpaceProvider = {
  provide: ActiveRouteCfOrgSpace,
  useFactory: getActiveRouteCfOrgSpace,
  deps: [
    ActivatedRoute,
  ]
};

export function goToAppWall(store: Store<AppState>, cfGuid: string, orgGuid?: string, spaceGuid?: string) {
  const appWallPagKey = 'applicationWall';
  store.dispatch(new SetClientFilter(applicationSchemaKey, appWallPagKey,
    {
      string: '',
      items: {
        cf: cfGuid,
        org: orgGuid,
        space: spaceGuid
      }
    }
  ));
  store.select(selectPaginationState(applicationSchemaKey, appWallPagKey)).pipe(
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
