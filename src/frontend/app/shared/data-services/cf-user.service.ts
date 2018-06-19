import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../core/cf-api.types';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import {
  isOrgAuditor,
  isOrgBillingManager,
  isOrgManager,
  isOrgUser,
  isSpaceAuditor,
  isSpaceDeveloper,
  isSpaceManager,
  waitForCFPermissions,
} from '../../features/cloud-foundry/cf.helpers';
import { GetAllUsersAsAdmin, GetAllUsersAsNonAdmin, GetUser } from '../../store/actions/users.actions';
import { AppState } from '../../store/app-state';
import { cfUserSchemaKey, entityFactory } from '../../store/helpers/entity-factory';
import {
  getPaginationObservables,
  PaginationObservables,
} from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../store/types/api.types';
import { PaginatedAction } from '../../store/types/pagination.types';
import {
  CfUser,
  createUserRoleInOrg,
  createUserRoleInSpace,
  IUserPermissionInOrg,
  IUserPermissionInSpace,
  UserRoleInOrg,
  UserRoleInSpace,
  OrgUserRoleNames,
  SpaceUserRoleNames,
} from '../../store/types/user.types';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';
import { ActiveRouteCfOrgSpace } from './../../features/cloud-foundry/cf-page.types';

@Injectable()
export class CfUserService {
  private allUsers$: Observable<PaginationObservables<APIResource<CfUser>>>;

  public static createPaginationAction(endpointGuid: string, isAdmin: boolean): PaginatedAction {
    return isAdmin ? new GetAllUsersAsAdmin(endpointGuid) : new GetAllUsersAsNonAdmin(endpointGuid);
  }

  constructor(
    private store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory,
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private entityServiceFactory: EntityServiceFactory,
  ) { }

  getUsers = (endpointGuid: string): Observable<APIResource<CfUser>[]> =>
    this.getAllUsers(endpointGuid).pipe(
      switchMap(paginationObservables => paginationObservables.entities$),
      publishReplay(1),
      refCount(),
      filter(p => {
        return !!p;
      }),
      map(users => {
        return users.filter(p => p.entity.cfGuid === endpointGuid);
      }),
      filter(p => {
        return p.length > 0;
      }),
    )

  getUser = (endpointGuid: string, userGuid: string): Observable<APIResource<CfUser>> => {
    return this.entityServiceFactory.create<APIResource<CfUser>>(
      cfUserSchemaKey,
      entityFactory(cfUserSchemaKey),
      userGuid,
      new GetUser(endpointGuid, userGuid),
      true
    ).entityObs$.pipe(
      filter(entity => !!entity),
      map(entity => entity.entity)
    );
  }

  getOrgRolesFromUser(user: CfUser): IUserPermissionInOrg[] {
    // User must be an 'org user' aka in the organizations collection, so loop through to get all orgs user might be in
    const role = user['organizations'] as APIResource<IOrganization>[];
    return role.map(org => {
      const orgGuid = org.metadata.guid;
      return {
        name: org.entity.name as string,
        orgGuid: org.metadata.guid,
        permissions: createUserRoleInOrg(
          isOrgManager(user, orgGuid),
          isOrgBillingManager(user, orgGuid),
          isOrgAuditor(user, orgGuid),
          isOrgUser(user, orgGuid)
        )
      };
    });
  }

  private parseSpaceRole(user: CfUser,
    processedSpaces: Set<string>,
    spacesToProcess: APIResource<ISpace>[],
    result: IUserPermissionInSpace[]) {
    spacesToProcess.forEach(space => {
      const spaceGuid = space.entity.guid;
      if (processedSpaces.has(spaceGuid)) {
        return;
      }
      result.push({
        name: space.entity.name as string,
        orgGuid: space.entity.organization_guid,
        spaceGuid,
        permissions: createUserRoleInSpace(
          isSpaceManager(user, spaceGuid),
          isSpaceAuditor(user, spaceGuid),
          isSpaceDeveloper(user, spaceGuid)
        )
      });
      processedSpaces.add(spaceGuid);
    });
  }

  getSpaceRolesFromUser(user: CfUser): IUserPermissionInSpace[] {
    const res: IUserPermissionInSpace[] = [];
    const spaceGuids = new Set<string>();
    // User might have unique spaces in any of the space role collections, so loop through each
    this.parseSpaceRole(user, spaceGuids, user.spaces, res);
    this.parseSpaceRole(user, spaceGuids, user.audited_spaces, res);
    this.parseSpaceRole(user, spaceGuids, user.managed_spaces, res);
    return res;
  }

  // Helper to determine if user has roles other than Org User
  hasRoles(user: CfUser, excludeOrgUser = true): boolean {

    const orgRoles = this.getOrgRolesFromUser(user);
    const spaceRoles = this.getSpaceRolesFromUser(user);

    let hasRoles = false;
    orgRoles.forEach(roles => {
      const permissions = roles.permissions;
      hasRoles = !!(hasRoles ||
      (
        permissions[OrgUserRoleNames.MANAGER] ||
        permissions[OrgUserRoleNames.BILLING_MANAGERS] ||
        permissions[OrgUserRoleNames.AUDITOR]
      ));

      if (!excludeOrgUser) {
        hasRoles = !!(hasRoles || permissions[OrgUserRoleNames.USER]);
      }
    });
    spaceRoles.forEach(roles => {
      const permissions = roles.permissions;
      hasRoles = !!(hasRoles ||
      (
        permissions[SpaceUserRoleNames.MANAGER] ||
        permissions[SpaceUserRoleNames.AUDITOR] ||
        permissions[SpaceUserRoleNames.DEVELOPER]

      ));
    });
    return hasRoles;
  }

  getUserRoleInOrg = (
    userGuid: string,
    orgGuid: string,
    cfGuid: string
  ): Observable<UserRoleInOrg> => {
    return this.getUsers(cfGuid).pipe(
      this.getUserFromUsers(userGuid),
      map(user => {
        return createUserRoleInOrg(
          isOrgManager(user.entity, orgGuid),
          isOrgBillingManager(user.entity, orgGuid),
          isOrgAuditor(user.entity, orgGuid),
          isOrgUser(user.entity, orgGuid)
        );
      }),
      first()
    );
  }

  getUserRoleInSpace = (
    userGuid: string,
    spaceGuid: string,
    cfGuid: string
  ): Observable<UserRoleInSpace> => {
    return this.getUsers(cfGuid).pipe(
      this.getUserFromUsers(userGuid),
      map(user => {
        return createUserRoleInSpace(
          isSpaceManager(user.entity, spaceGuid),
          isSpaceAuditor(user.entity, spaceGuid),
          isSpaceDeveloper(user.entity, spaceGuid)
        );
      })
    );
  }

  private getAllUsers(endpointGuid: string): Observable<PaginationObservables<APIResource<CfUser>>> {
    if (!this.allUsers$) {
      this.allUsers$ = waitForCFPermissions(this.store, endpointGuid).pipe(
        map(cfPermissions => {
          const allUsersAction = CfUserService.createPaginationAction(endpointGuid, cfPermissions.global.isAdmin);
          return getPaginationObservables<APIResource<CfUser>>({
            store: this.store,
            action: allUsersAction,
            paginationMonitor: this.paginationMonitorFactory.create(
              allUsersAction.paginationKey,
              entityFactory(cfUserSchemaKey)
            )
          });
        })
      );
    }
    return this.allUsers$;
  }

  private getUserFromUsers(userGuid: string): (source: Observable<APIResource<CfUser>[]>) => Observable<APIResource<CfUser>> {
    return map(users => {
      return users.filter(o => o.metadata.guid === userGuid)[0];
    });
  }
}
