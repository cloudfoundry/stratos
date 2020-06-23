import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf, of, ReplaySubject } from 'rxjs';
import { filter, first, map, multicast, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';

import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { cfUserEntityType, organizationEntityType, spaceEntityType } from '../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { getCurrentUserCFGlobalStates } from '../../../../cloud-foundry/src/store/selectors/cf-current-user-role.selectors';
import {
  LocalPaginationHelpers,
} from '../../../../core/src/shared/components/list/data-sources-controllers/local-list.helpers';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import {
  getDefaultPaginationEntityState,
} from '../../../../store/src/reducers/pagination-reducer/pagination-reducer-reset-pagination';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import {
  getCurrentPageRequestInfo,
  PaginationObservables,
} from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.types';
import { APIResource } from '../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../store/src/types/pagination.types';
import { IOrganization, ISpace } from '../../cf-api.types';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { cfEntityFactory } from '../../cf-entity-factory';
import { ActiveRouteCfOrgSpace } from '../../features/cloud-foundry/cf-page.types';
import {
  fetchTotalResults,
  filterEntitiesByGuid,
  isOrgAuditor,
  isOrgBillingManager,
  isOrgManager,
  isOrgUser,
  isSpaceAuditor,
  isSpaceDeveloper,
  isSpaceManager,
  waitForCFPermissions,
} from '../../features/cloud-foundry/cf.helpers';
import { selectCfPaginationState } from '../../store/selectors/pagination.selectors';
import {
  CfUser,
  createUserRoleInOrg,
  createUserRoleInSpace,
  IUserPermissionInOrg,
  IUserPermissionInSpace,
  UserRoleInOrg,
  UserRoleInSpace,
} from '../../store/types/cf-user.types';

@Injectable()
export class CfUserService {
  private allUsers$: Observable<PaginationObservables<APIResource<CfUser>>>;

  users: { [guid: string]: Observable<APIResource<CfUser>> } = {};

  constructor(
    private store: Store<CFAppState>,
    public paginationMonitorFactory: PaginationMonitorFactory,
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
  ) { }

  getUsers = (endpointGuid: string, filterEmpty = true): Observable<APIResource<CfUser>[]> =>
    this.getAllUsers(endpointGuid).pipe(
      switchMap(paginationObservables => combineLatest(
        // Entities should be subbed to so the api request is made
        paginationObservables.entities$.pipe(
          // In the event of maxed lists entities never fires... so start with something
          startWith(null),
        ),
        paginationObservables.pagination$
      )),
      publishReplay(1),
      refCount(),
      filter(([users, pagination]) => {
        // Filter until we have a result
        const currentPage = getCurrentPageRequestInfo(pagination, null);
        if (!currentPage) {
          return false;
        }
        const isMaxed = LocalPaginationHelpers.isPaginationMaxed(pagination);
        return !currentPage.busy && (!!users || currentPage.error || isMaxed);
      }),
      map(([users, pagination]) => {
        const currentPage = getCurrentPageRequestInfo(pagination, null);
        const isMaxed = LocalPaginationHelpers.isPaginationMaxed(pagination);
        const hasFailed = currentPage.error || isMaxed;
        if (!currentPage || hasFailed) {
          return null;
        }

        // Include only the users from the required endpoint
        // (Think this is now a no-op as the actions have since been fixed to return only users from a single cf but keeping for the moment)
        return !!users ? users.filter(p => p.entity.cfGuid === endpointGuid) : null;
      }),
      filter(users => filterEmpty ? !!users : true)
    )

  getUser = (endpointGuid: string, userGuid: string): Observable<any> => {
    // Attempt to get user from all users first, this better covers the case when a non-admin can't hit /users
    return this.getUsers(endpointGuid, false).pipe(
      switchMap(users => {
        // `users` will be null if we can't handle the fetch (connected as non-admin with lots of orgs). For those case fall back on the
        // user entity. Why not just use the user entity? There's a lot of these requests.. in parallel if we're fetching a list of users
        // at the same time
        if (users) {
          return observableOf(users.filter(o => o.metadata.guid === userGuid)[0]);
        }
        if (!this.users[userGuid]) {
          this.users[userGuid] = cfEntityCatalog.user.store.getEntityService(userGuid, endpointGuid)
            .waitForEntity$.pipe(
              filter(entity => !!entity),
              map(entity => entity.entity)
            );
        }
        return this.users[userGuid];
      }),
      publishReplay(1),
      refCount()
    );
  }

  private parseOrgRole(
    user: CfUser,
    processedOrgs: Set<string>,
    orgsToProcess: APIResource<IOrganization>[],
    result: IUserPermissionInOrg[]) {
    orgsToProcess.forEach(org => {
      const orgGuid = org.metadata.guid;
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

  private parseSpaceRole(
    user: CfUser,
    processedSpaces: Set<string>,
    spacesToProcess: APIResource<ISpace>[],
    result: IUserPermissionInSpace[]) {
    spacesToProcess.forEach(space => {
      const spaceGuid = space.metadata.guid;
      if (processedSpaces.has(spaceGuid)) {
        return;
      }
      result.push({
        name: space.entity.name as string,
        orgGuid: space.entity.organization_guid,
        orgName: null,
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

  /**
   * Get the space roles for a user
   * @param spaces Only fetch roles for these specific spaces. If missing fetch roles for all spaces
   */
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

  hasSpaceRoles(user: CfUser, spaceGuid: string): boolean {
    return this.populatedArray(filterEntitiesByGuid(spaceGuid, user.audited_spaces)) ||
      this.populatedArray(filterEntitiesByGuid(spaceGuid, user.managed_spaces)) ||
      this.populatedArray(filterEntitiesByGuid(spaceGuid, user.spaces));
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
    return this.getUser(cfGuid, userGuid).pipe(
      map(user => {
        return createUserRoleInSpace(
          isSpaceManager(user.entity, spaceGuid),
          isSpaceAuditor(user.entity, spaceGuid),
          isSpaceDeveloper(user.entity, spaceGuid)
        );
      })
    );
  }

  fetchTotalUsers(cfGuid: string, orgGuid?: string, spaceGuid?: string): Observable<number> {
    return this.isConnectedUserAdmin(cfGuid).pipe(
      switchMap(isAdmin => {
        // Non-admins at the cf level cannot fetch a list of all users easily (non-admins cannot access /users list)
        return (isAdmin || orgGuid || spaceGuid) ? fetchTotalResults(
          this.createPaginationActionFromLevel(isAdmin, cfGuid, orgGuid, spaceGuid),
          this.store,
          this.paginationMonitorFactory
        ) : observableOf(null);
      }),
      publishReplay(1),
      refCount()
    );
  }

  private getAllUsers(endpointGuid: string): Observable<PaginationObservables<APIResource<CfUser>>> {
    if (!this.allUsers$) {
      this.allUsers$ = waitForCFPermissions(this.store, endpointGuid).pipe(
        switchMap(cf => {
          const isAdmin = cf.global.isAdmin;
          // Note - This service is used at cf, org and space level of the cf pages.
          // We shouldn't attempt to fetch all users if at the cf level
          if (
            this.activeRouteCfOrgSpace.cfGuid &&
            (
              isAdmin ||
              this.activeRouteCfOrgSpace.orgGuid ||
              this.activeRouteCfOrgSpace.spaceGuid
            )
          ) {
            return this.createPaginationAction(
              isAdmin,
              this.activeRouteCfOrgSpace.cfGuid,
              this.activeRouteCfOrgSpace.orgGuid,
              this.activeRouteCfOrgSpace.spaceGuid
            ).pipe(
              map(allUsersAction => getPaginationObservables({
                store: this.store,
                action: allUsersAction,
                paginationMonitor: this.paginationMonitorFactory.create(
                  allUsersAction.paginationKey,
                  cfEntityFactory(cfUserEntityType),
                  allUsersAction.flattenPagination
                )
              }, allUsersAction.flattenPagination))
            );

          } else {
            const defaultPag = getDefaultPaginationEntityState();
            const erroredPag = {
              ...defaultPag,
              currentPage: 1,
              pageRequests: {
                ...defaultPag.pageRequests,
                [1]: {
                  busy: false,
                  error: true,
                  message: 'Fetching users at this level is not permitted'
                }
              }
            };
            return observableOf<PaginationObservables<APIResource<CfUser>>>({
              pagination$: observableOf(erroredPag),
              entities$: observableOf(null),
              hasEntities$: observableOf(false),
              totalEntities$: observableOf(0),
              fetchingEntities$: observableOf(false),
            });
          }
        }),
        multicast(() => new ReplaySubject<any>(1)),
        refCount()
      );
    }
    return this.allUsers$;
  }

  /**
   * Create a paginated action that will fetch a list of users.
   *  Admins - Aim to fetch all CF users regardless of cf/org/space level. If this is not possible (haven't previously fetched OR there's
   *  too many to fetch) fall back to either org or space users lists depending on level
   *  Non-admins - Show org or space users depending on level
   * @param orgGuid Populated if user is at org level
   * @param spaceGuid Populated if user is at space level
   */
  public createPaginationAction(isAdmin: boolean, cfGuid: string, orgGuid?: string, spaceGuid?: string): Observable<PaginatedAction> {
    if (isAdmin) {
      const allCfUsersAction = this.createCfGetAllUsersAction(cfGuid);

      if (!orgGuid) {
        return observableOf(allCfUsersAction);
      }

      const cfUserEntityConfig = entityCatalog.getEntity(allCfUsersAction);

      // Do we have the list already and it's not maxed (user has previously loaded all users, possibly forcing this load)?
      const hasAllUsers$ = this.store.select(selectCfPaginationState(cfUserEntityConfig.type, allCfUsersAction.paginationKey)).pipe(
        filter(paginationState =>
          !paginationState || // No pagination state... list has never loaded
          (paginationState.pageRequests &&
            paginationState.pageRequests[paginationState.currentPage] &&
            !paginationState.pageRequests[paginationState.currentPage].busy) || // Have list, not loading
          !paginationState.pageRequests[paginationState.currentPage] // Had list, not loading
        ),
        map(paginationState => paginationState ? !LocalPaginationHelpers.isPaginationMaxed(paginationState) : false),
        first()
      );
      // Will we max out if attempting to fetch all users?
      const willBeMaxed$ = this.fetchTotalUsers(cfGuid).pipe(
        first(),
        switchMap(totalResults => combineLatest([
          of(totalResults),
          cfUserEntityConfig.getPaginationConfig().maxedStateStartAt(this.store, allCfUsersAction)
        ])
        ),
        map(([totalResults, maxEntities]) => {
          return maxEntities && totalResults >= maxEntities;
        })
      );


      return hasAllUsers$.pipe(
        first(),
        switchMap(hasAllUsers => {
          if (hasAllUsers) {
            return of(false);
          }
          return willBeMaxed$;
        }),
        map((cannotShowAllUsers) => {
          if (cannotShowAllUsers) {
            // Either show list of users from org or space, depending on level
            return !spaceGuid ?
              this.createOrgGetUsersAction(isAdmin, cfGuid, orgGuid) :
              this.createSpaceGetUsersAction(isAdmin, cfGuid, spaceGuid);
          }
          // We can safely show all users regardless of what cf/org/level list we're showing
          return allCfUsersAction;

        })
      );
    }
    return observableOf(this.createPaginationActionFromLevel(isAdmin, cfGuid, orgGuid, spaceGuid));
  }

  /**
   * Create a paginated action that will fetch a list of users with respect to the level (cf, org or space)
   * @param orgGuid Populated if user is at org level
   * @param spaceGuid Populated if user is at space level
   */
  private createPaginationActionFromLevel(isAdmin: boolean, cfGuid: string, orgGuid?: string, spaceGuid?: string): PaginatedAction {
    if (!orgGuid) {
      // Create an action to fetch all users across the entire cf
      if (isAdmin) {
        return this.createCfGetAllUsersAction(cfGuid);
      }
      // Non-admins at cf level should never reach here, this is a genuine issue that if we hit the extra feed back will help
      throw new Error('Unsupported: Cloud Foundry non-administrators cannot access all users list');
    } else if (!spaceGuid) {
      // Create an action to fetch all users in an organisation
      return this.createOrgGetUsersAction(isAdmin, cfGuid, orgGuid);
    }

    // Create an action to fetch all users in a space
    return this.createSpaceGetUsersAction(isAdmin, cfGuid, spaceGuid);
  }

  private createCfGetAllUsersAction = (cfGuid: string): PaginatedAction => {
    return cfEntityCatalog.user.actions.getMultiple(cfGuid, null);
  }

  private createOrgGetUsersAction = (isAdmin: boolean, cfGuid: string, orgGuid: string): PaginatedAction => {
    return cfEntityCatalog.user.actions.getAllInOrganization(
      orgGuid,
      cfGuid,
      createEntityRelationPaginationKey(organizationEntityType, orgGuid),
      isAdmin
    );
  }

  private createSpaceGetUsersAction = (isAdmin: boolean, cfGuid: string, spaceGuid: string, ): PaginatedAction => {
    return cfEntityCatalog.user.actions.getAllInSpace(
      spaceGuid,
      cfGuid,
      createEntityRelationPaginationKey(spaceEntityType, spaceGuid),
      isAdmin
    );
  }

  public isConnectedUserAdmin = (cfGuid: string): Observable<boolean> =>
    this.store.select(getCurrentUserCFGlobalStates(cfGuid)).pipe(
      filter(state => !!state),
      map(state => state.isAdmin),
      first()
    )
}
