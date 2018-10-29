import { Injectable } from '@angular/core';
import { Headers, Http, Request, RequestOptions, URLSearchParams } from '@angular/http';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { combineLatest, filter, first, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
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
  filterEntitiesByGuid,
} from '../../features/cloud-foundry/cf.helpers';
import { GetAllOrgUsers } from '../../store/actions/organization.actions';
import { GetAllUsersAsAdmin, GetAllUsersAsNonAdmin, GetUser } from '../../store/actions/users.actions';
import { AppState } from '../../store/app-state';
import { cfUserSchemaKey, entityFactory, organizationSchemaKey } from '../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../store/helpers/entity-relations/entity-relations.types';
import {
  getPaginationObservables,
  PaginationObservables,
} from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { getCurrentUserCFGlobalStates } from '../../store/selectors/current-user-roles-permissions-selectors/role.selectors';
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
} from '../../store/types/user.types';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';
import { ActiveRouteCfOrgSpace } from '../../features/cloud-foundry/cf-page.types';

const { proxyAPIVersion, cfAPIVersion } = environment;

@Injectable()
export class CfUserService {
  private allUsers$: Observable<PaginationObservables<APIResource<CfUser>>>;

  users: { [guid: string]: Observable<APIResource<CfUser>> } = {};

  constructor(
    private store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory,
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private entityServiceFactory: EntityServiceFactory,
    private http: Http,
  ) { }

  getUsers = (endpointGuid: string, filterEmpty = true): Observable<APIResource<CfUser>[]> =>
    this.getAllUsers(endpointGuid).pipe(
      switchMap(paginationObservables => paginationObservables.entities$),
      publishReplay(1),
      refCount(),
      filter(p => {
        return filterEmpty ? !!p : true;
      }),
      map(users => {
        return filterEmpty ? users.filter(p => p.entity.cfGuid === endpointGuid) : null;
      }),
      filter(p => {
        return filterEmpty ? p.length > 0 : true;
      }),
    )

  getUser = (endpointGuid: string, userGuid: string): Observable<any> => {
    return this.getUsers(endpointGuid, false).pipe(
      switchMap(users => {
        // `users` will be null if we can't handle the fetch (connected as non-admin with lots of orgs). For those case fall back on the
        // user entity. Why not just use the user entity? There's a lot of these requests.. in parallel if we're fetching a list of users
        // at the same time
        if (users) {
          return observableOf(users.filter(o => o.metadata.guid === userGuid)[0]);
        }
        if (!this.users[userGuid]) {
          this.users[userGuid] = this.entityServiceFactory.create<APIResource<CfUser>>(
            cfUserSchemaKey,
            entityFactory(cfUserSchemaKey),
            userGuid,
            new GetUser(endpointGuid, userGuid),
            true
          ).waitForEntity$.pipe(
            filter(entity => !!entity),
            map(entity => entity.entity)
          );
        }
        return this.users[userGuid];
      }));
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

  private populatedArray(array?: Array<any>): boolean {
    return array && !!array.length;
  }

  /**
   * Helper to determine if user has roles other than Org User
   */
  hasRolesInOrg(user: CfUser, orgGuid: string, excludeOrgUser = true): boolean {

    // Check org roles
    if (this.populatedArray(filterEntitiesByGuid(orgGuid, user.audited_organizations)) ||
      this.populatedArray(filterEntitiesByGuid(orgGuid, user.billing_managed_organizations)) ||
      this.populatedArray(filterEntitiesByGuid(orgGuid, user.managed_organizations)) ||
      (!excludeOrgUser && this.populatedArray(filterEntitiesByGuid(orgGuid, user.organizations)))) {
      return true;
    }

    // Check space roles
    return this.hasSpaceRolesInOrg(user, orgGuid);
  }

  private filterByOrg(orgGuid: string, array?: Array<APIResource<ISpace>>): Array<APIResource<ISpace>> {
    return array ? array.filter(space => space.entity.organization_guid === orgGuid) : null;
  }

  /**
   * Helper to determine if user has space roles in an organization
   */
  hasSpaceRolesInOrg(user: CfUser, orgGuid: string): boolean {
    return this.populatedArray(this.filterByOrg(orgGuid, user.audited_spaces)) ||
      this.populatedArray(this.filterByOrg(orgGuid, user.managed_spaces)) ||
      this.populatedArray(this.filterByOrg(orgGuid, user.spaces));
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
        combineLatest(this.canFetchAllUsers()),
        switchMap(([isAdmin, canFetchAllUsers]) => {
          // Note - This service is used at cf, org and space level of the cf pages.
          // We shouldn't attempt to fetch all users if at the cf level and there's more than x orgs
          if (
            this.activeRouteCfOrgSpace.cfGuid &&
            (
              isAdmin ||
              canFetchAllUsers ||
              this.activeRouteCfOrgSpace.orgGuid ||
              this.activeRouteCfOrgSpace.spaceGuid
            )
          ) {
            return this.createPaginationAction(isAdmin, !!this.activeRouteCfOrgSpace.spaceGuid).pipe(
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

  public createPaginationAction(isAdmin: boolean, isSpace: boolean): Observable<PaginatedAction> {
    if (isAdmin) {
      return observableOf(new GetAllUsersAsAdmin(this.activeRouteCfOrgSpace.cfGuid));
    }
    return this.canFetchAllUsers().pipe(
      map(canFetchAllUsers => {
        if (canFetchAllUsers) {
          return new GetAllUsersAsNonAdmin(this.activeRouteCfOrgSpace.cfGuid, !isSpace);
        } else {
          const usersPaginationKey = createEntityRelationPaginationKey(organizationSchemaKey, this.activeRouteCfOrgSpace.orgGuid);
          return new GetAllOrgUsers(this.activeRouteCfOrgSpace.orgGuid, usersPaginationKey, this.activeRouteCfOrgSpace.cfGuid, false);
        }
      })
    );
  }

  private canFetchAllUsers = (): Observable<boolean> => {
    // Make a separate request to count orgs. If we do this via the normal pagination orgs call we fail to fill many orgs with their
    // required properties. This leads to a LOT of request to fill them in when we validate the orgs later on
    const options = new RequestOptions();
    options.url = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/organizations`;
    options.params = new URLSearchParams('');
    options.params.set('results-per-page', '1');
    options.method = 'get';
    options.headers = new Headers();
    options.headers.set('x-cap-cnsi-list', this.activeRouteCfOrgSpace.cfGuid);
    options.headers.set('x-cap-passthrough', 'true');
    return this.http.request(new Request(options)).pipe(
      map(response => {
        let resData;
        try {
          resData = response.json();
        } catch (e) {
          resData = { total_results: Number.MAX_SAFE_INTEGER };
        }
        return resData.total_results < 10;
      }));
  }

  public isConnectedUserAdmin = (cfGuid: string): Observable<boolean> =>
    this.store.select(getCurrentUserCFGlobalStates(cfGuid)).pipe(
      filter(state => !!state),
      map(state => state.isAdmin),
      first()
    )
}
