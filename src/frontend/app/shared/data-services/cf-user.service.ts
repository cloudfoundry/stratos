import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap, withLatestFrom, combineLatest } from 'rxjs/operators';

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
import { GetAllOrganizations, GetAllOrgUsers } from '../../store/actions/organization.actions';
import { GetAllUsersAsAdmin, GetAllUsersAsNonAdmin, GetUser } from '../../store/actions/users.actions';
import { AppState } from '../../store/app-state';
import {
  cfUserSchemaKey,
  endpointSchemaKey,
  entityFactory,
  organizationSchemaKey,
} from '../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../store/helpers/entity-relations.types';
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
  OrgUserRoleNames,
  SpaceUserRoleNames,
  UserRoleInOrg,
  UserRoleInSpace,
} from '../../store/types/user.types';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';
import { ActiveRouteCfOrgSpace } from './../../features/cloud-foundry/cf-page.types';

@Injectable()
export class CfUserService {
  private allUsers$: Observable<PaginationObservables<APIResource<CfUser>>>;

  public static createPaginationAction(
    endpointGuid: string,
    isAdmin: boolean,
    orgGuid?: string,
    store?: Store<AppState>,
    paginationMonitorFactory?: PaginationMonitorFactory
  ): Observable<PaginatedAction> {
    if (isAdmin) {
      return observableOf(new GetAllUsersAsAdmin(endpointGuid));
    }
    return CfUserService.canFetchAllUsers(store, paginationMonitorFactory, endpointGuid).pipe(
      map(canFetchAllUsers => {
        if (canFetchAllUsers) {
          return new GetAllUsersAsNonAdmin(endpointGuid);
        } else if (!orgGuid) {
          // Danger! If there's no org guid and there's a ton of orgs this will be an expensive action.
          console.log('DANGER');
          return new GetAllUsersAsNonAdmin(endpointGuid);
        } else {
          const usersPaginationKey = createEntityRelationPaginationKey(organizationSchemaKey, orgGuid);
          return new GetAllOrgUsers(orgGuid, usersPaginationKey, endpointGuid);
        }
      })
    );
  }

  private static canFetchAllUsers = (
    store: Store<AppState>,
    paginationMonitorFactory: PaginationMonitorFactory,
    endpointGuid: string): Observable<boolean> => {
    // TODO: RC Comment
    const getAllOrgsPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, endpointGuid);
    const orgsObs = getPaginationObservables<APIResource<IOrganization>>({
      store,
      action: new GetAllOrganizations(getAllOrgsPaginationKey, endpointGuid),
      paginationMonitor: paginationMonitorFactory.create(
        getAllOrgsPaginationKey,
        entityFactory(organizationSchemaKey)
      )
    });



    return orgsObs.entities$.pipe(
      filter(entities => !!entities),
      map(entities => entities.length < 20),
      first()
    );
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

  private parseOrgRole(user: CfUser,
    processedOrgs: Set<string>,
    orgsToProcess: APIResource<IOrganization>[],
    result: IUserPermissionInOrg[]) {
    orgsToProcess.forEach(org => {
      const orgGuid = org.entity.guid;
      if (processedOrgs.has(orgGuid)) {
        return;
      }
      result.push({
        name: org.entity.name as string,
        orgGuid: org.metadata.guid,
        permissions: createUserRoleInOrg(
          isOrgManager(user, orgGuid),
          isOrgBillingManager(user, orgGuid),
          isOrgAuditor(user, orgGuid),
          isOrgUser(user, orgGuid)
        )
      });
      processedOrgs.add(orgGuid);
    });
  }

  getOrgRolesFromUser(user: CfUser, org?: APIResource<IOrganization>): IUserPermissionInOrg[] {
    const res: IUserPermissionInOrg[] = [];
    const orgGuids = new Set<string>();
    if (org) {
      // Discover user's roles in this specific org
      this.parseOrgRole(user, orgGuids, [org], res);
    } else {
      // Discover user's roles for each org via each of the 4 org role types
      this.parseOrgRole(user, orgGuids, user.organizations || [], res);
      this.parseOrgRole(user, orgGuids, user.audited_organizations || [], res);
      this.parseOrgRole(user, orgGuids, user.billing_managed_organizations || [], res);
      this.parseOrgRole(user, orgGuids, user.managed_organizations || [], res);
    }
    return res;
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

  getSpaceRolesFromUser(user: CfUser, spaces?: APIResource<ISpace>[]): IUserPermissionInSpace[] {
    const res: IUserPermissionInSpace[] = [];
    const spaceGuids = new Set<string>();
    if (spaces) {
      // Discover user's roles in this specific space
      this.parseSpaceRole(user, spaceGuids, spaces, res);
    } else {
      // User might have unique spaces in any of the space role collections, so loop through each
      this.parseSpaceRole(user, spaceGuids, user.spaces || [], res);
      this.parseSpaceRole(user, spaceGuids, user.audited_spaces || [], res);
      this.parseSpaceRole(user, spaceGuids, user.managed_spaces || [], res);
    }
    return res;
  }

  /**
   * Helper to determine if user has roles other than Org User
   */
  hasRolesInOrg(user: CfUser, orgGuid: string, excludeOrgUser = true): boolean {

    const orgRoles = this.getOrgRolesFromUser(user).filter(o => o.orgGuid === orgGuid);
    const spaceRoles = this.getSpaceRolesFromUser(user).filter(o => o.orgGuid === orgGuid);

    for (const roleKey in orgRoles) {
      if (!orgRoles.hasOwnProperty(roleKey)) {
        continue;
      }

      const permissions = orgRoles[roleKey].permissions;
      if (
        permissions[OrgUserRoleNames.MANAGER] ||
        permissions[OrgUserRoleNames.BILLING_MANAGERS] ||
        permissions[OrgUserRoleNames.AUDITOR]
      ) {
        return true;
      }
      if (!excludeOrgUser && permissions[OrgUserRoleNames.USER]) {
        return true;
      }
    }

    for (const roleKey in spaceRoles) {
      if (!spaceRoles.hasOwnProperty(roleKey)) {
        continue;
      }

      const permissions = spaceRoles[roleKey].permissions;
      if (permissions[SpaceUserRoleNames.MANAGER] ||
        permissions[SpaceUserRoleNames.AUDITOR] ||
        permissions[SpaceUserRoleNames.DEVELOPER]) {
        return true;
      }
    }
  }

  getUserRoleInOrg = (
    userGuid: string,
    orgGuid: string,
    cfGuid: string
  ): Observable<UserRoleInOrg> => {
    return this.getUser(cfGuid, userGuid).pipe(
      filter(user => !!user && !!user.metadata),
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

    // return this.getUsers(cfGuid).pipe(
    //   this.getUserFromUsers(userGuid),
    //   map(user => {
    //     return createUserRoleInOrg(
    //       isOrgManager(user.entity, orgGuid),
    //       isOrgBillingManager(user.entity, orgGuid),
    //       isOrgAuditor(user.entity, orgGuid),
    //       isOrgUser(user.entity, orgGuid)
    //     );
    //   }),
    //   first()
    // );
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
        map(cf => cf.global.isAdmin),
        combineLatest(CfUserService.canFetchAllUsers(this.store, this.paginationMonitorFactory, endpointGuid)),
        switchMap(([isAdmin, canFetchAllUsers]) => {
          if (isAdmin || canFetchAllUsers) {
            return CfUserService.createPaginationAction(
              endpointGuid,
              isAdmin,
              this.activeRouteCfOrgSpace.orgGuid,
              this.store,
              this.paginationMonitorFactory).pipe(
                map(allUsersAction => getPaginationObservables<APIResource<CfUser>>({
                  store: this.store,
                  action: allUsersAction,
                  paginationMonitor: this.paginationMonitorFactory.create(
                    allUsersAction.paginationKey,
                    entityFactory(cfUserSchemaKey)
                  )
                }))
              );
          } else {
            return observableOf({
              pagination$: observableOf(null),
              entities$: observableOf(null)
            });
          }
        }),
        publishReplay(1),
        refCount()
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
