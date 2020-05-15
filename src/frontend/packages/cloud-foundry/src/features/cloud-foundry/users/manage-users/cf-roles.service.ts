import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import {
  combineLatest as combineLatestOperators,
  distinctUntilChanged,
  filter,
  first,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
} from 'rxjs/operators';

import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { CurrentUserPermissionsChecker } from '../../../../../../core/src/core/current-user-permissions.checker';
import { CurrentUserPermissionsService } from '../../../../../../core/src/core/current-user-permissions.service';
import { endpointSchemaKey } from '../../../../../../store/src/helpers/entity-factory';
import {
  selectUsersRolesCf,
  selectUsersRolesPicked,
  selectUsersRolesRoles,
} from '../../../../../../store/src/selectors/users-roles.selector';
import { APIResource, EntityInfo } from '../../../../../../store/src/types/api.types';
import { UsersRolesSetChanges } from '../../../../actions/users-roles.actions';
import { IOrganization, ISpace } from '../../../../cf-api.types';
import { CFAppState } from '../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { organizationEntityType, spaceEntityType } from '../../../../cf-entity-types';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { createDefaultOrgRoles, createDefaultSpaceRoles } from '../../../../store/reducers/users-roles.reducer';
import { CfUser, IUserPermissionInOrg, UserRoleInOrg, UserRoleInSpace } from '../../../../store/types/user.types';
import { CfRoleChange, CfUserRolesSelected } from '../../../../store/types/users-roles.types';
import { canUpdateOrgSpaceRoles } from '../../cf.helpers';

@Injectable()
export class CfRolesService {

  existingRoles$: Observable<CfUserRolesSelected>;
  newRoles$: Observable<IUserPermissionInOrg>;
  loading$: Observable<boolean>;
  cfOrgs: { [cfGuid: string]: Observable<APIResource<IOrganization>[]> } = {};

  /**
   * Given a list of orgs or spaces remove those that the connected user cannot edit roles in.
   */
  static filterEditableOrgOrSpace<T extends IOrganization | ISpace>(
    userPerms: CurrentUserPermissionsService,
    isOrg: boolean,
    orgOrSpaces$: Observable<APIResource<T>[]>
  ): Observable<APIResource<T>[]> {
    return orgOrSpaces$.pipe(
      // Create an observable containing the original list of organisations and a corresponding list of whether an org can be edited
      switchMap(orgsOrSpaces => {
        return combineLatest(
          observableOf(orgsOrSpaces),
          combineLatest(orgsOrSpaces.map(orgOrSpace => CfRolesService.canEditOrgOrSpace(
            userPerms,
            orgOrSpace.metadata.guid,
            orgOrSpace.entity.cfGuid,
            isOrg ? orgOrSpace.metadata.guid : (orgOrSpace as APIResource<ISpace>).entity.organization_guid,
            isOrg ? CurrentUserPermissionsChecker.ALL_SPACES : orgOrSpace.metadata.guid,
          ))));
      }),
      // Filter out orgs than the current user cannot edit
      map(([orgs, canEdit]) => orgs.filter(org => canEdit.find(canEditOrgOrSpace => canEditOrgOrSpace.guid === org.metadata.guid).canEdit)),
    );
  }

  /**
   * Create an observable with an org/space guids and whether it can be edited by the connected user
   */
  static canEditOrgOrSpace<T>(
    userPerms: CurrentUserPermissionsService,
    guid: string,
    cfGuid: string,
    orgGuid: string,
    spaceGuid): Observable<{ guid: string, canEdit: boolean }> {
    return canUpdateOrgSpaceRoles(userPerms, cfGuid, orgGuid, spaceGuid).pipe(
      first(),
      map(canEdit => ({ guid, canEdit }))
    );
  }

  constructor(
    private store: Store<CFAppState>,
    private cfUserService: CfUserService,
    private userPerms: CurrentUserPermissionsService,
  ) {
    this.existingRoles$ = this.store.select(selectUsersRolesPicked).pipe(
      combineLatestOperators(this.store.select(selectUsersRolesCf)),
      filter(([users, cfGuid]) => !!cfGuid),
      switchMap(([users, cfGuid]) => this.populateRoles(cfGuid, users)),
      distinctUntilChanged(),
      publishReplay(1),
      refCount()
    );
    this.newRoles$ = this.store.select(selectUsersRolesRoles).pipe(
      distinctUntilChanged(),
      publishReplay(1),
      refCount()
    );

    this.loading$ = this.existingRoles$.pipe(
      combineLatestOperators(this.newRoles$),
      map(([existingRoles, newRoles]) => !existingRoles || !newRoles),
      startWith(true),
    );
  }

  /**
   * Take the structure that cf stores user roles in (per user and flat) and convert into a format that's easier to use and compare with
   * (easier to access at specific levels, easier to parse pieces around)
   */
  populateRoles(cfGuid: string, selectedUsers: CfUser[]): Observable<CfUserRolesSelected> {
    if (!cfGuid || !selectedUsers || selectedUsers.length === 0) {
      return observableOf({});
    }

    const userGuids = selectedUsers.map(user => user.guid);
    return this.cfUserService.getUsers(cfGuid).pipe(
      map(users => {
        const roles = {};
        // For each user (excluding those that are not selected)....
        users.forEach(user => {
          if (userGuids.indexOf(user.metadata.guid) >= 0) {
            this.populateUserRoles(user, roles);
          }
        });
        return roles;
      }),
    );
  }

  private populateUserRoles(user: APIResource<CfUser>, roles: CfUserRolesSelected) {
    const mappedUser: { [orgGuid: string]: IUserPermissionInOrg } = {};
    const orgRoles = this.cfUserService.getOrgRolesFromUser(user.entity);
    const spaceRoles = this.cfUserService.getSpaceRolesFromUser(user.entity);
    // ... populate org roles ...
    orgRoles.forEach(org => {
      mappedUser[org.orgGuid] = {
        ...org,
        spaces: {}
      };
    });
    // ... and for each space, populate space roles
    spaceRoles.forEach(space => {
      if (!mappedUser[space.orgGuid]) {
        mappedUser[space.orgGuid] = createDefaultOrgRoles(space.orgGuid, space.orgName);
      }
      if (!space.orgName && mappedUser[space.orgGuid]) {
        space.orgName = mappedUser[space.orgGuid].name;
      }
      mappedUser[space.orgGuid].spaces[space.spaceGuid] = {
        ...space
      };
    });
    roles[user.metadata.guid] = mappedUser;
  }

  /**
   * Create a collection of role `change` items representing the diff between existing roles and newly selected roles.
   */
  createRolesDiff(orgGuid: string): Observable<CfRoleChange[]> {
    return this.existingRoles$.pipe(
      combineLatestOperators(
        this.newRoles$,
        this.store.select(selectUsersRolesPicked),
      ),
      first(),
      map(([existingRoles, newRoles, pickedUsers]) => {
        const changes = [];
        // For each user, loop through the new roles and compare with any existing. If there's a diff, add it to a changes collection to be
        // returned
        pickedUsers.forEach(user => {
          changes.push(...this.createRolesUserDiff(existingRoles, newRoles, changes, user, orgGuid));
        });
        this.store.dispatch(new UsersRolesSetChanges(changes));
        return changes;
      })
    );
  }

  private createRolesUserDiff(
    existingRoles: CfUserRolesSelected,
    newRoles: IUserPermissionInOrg,
    changes: CfRoleChange[],
    user: CfUser,
    orgGuid: string
  ): CfRoleChange[] {
    const existingUserRoles = existingRoles[user.guid] || {};
    const newChanges: CfRoleChange[] = [];

    // Compare org roles
    const existingOrgRoles = existingUserRoles[orgGuid] || createDefaultOrgRoles(orgGuid, newRoles.name);
    newChanges.push(...this.comparePermissions({
      userGuid: user.guid,
      orgGuid,
      orgName: newRoles.name,
      add: false,
      role: null
    },
      existingOrgRoles.permissions, newRoles.permissions));

    // Compare space roles
    Object.keys(newRoles.spaces).forEach(spaceGuid => {
      const newSpace = newRoles.spaces[spaceGuid];
      const oldSpace = existingOrgRoles.spaces[spaceGuid] || createDefaultSpaceRoles(orgGuid, newRoles.name, spaceGuid, newSpace.name);
      newChanges.push(...this.comparePermissions({
        userGuid: user.guid,
        orgGuid,
        orgName: newRoles.name,
        spaceGuid,
        spaceName: newSpace.name,
        add: false,
        role: null
      },
        oldSpace.permissions, newSpace.permissions));
    });

    return newChanges;
  }

  fetchOrg(cfGuid: string, orgGuid: string): Observable<EntityInfo<APIResource<IOrganization>>> {
    return cfEntityCatalog.org.store.getEntityService(orgGuid, cfGuid, { includeRelations: [], populateMissing: false })
      .waitForEntity$;
  }

  fetchOrgEntity(cfGuid: string, orgGuid: string): Observable<APIResource<IOrganization>> {
    return this.fetchOrg(cfGuid, orgGuid).pipe(
      filter(entityInfo => !!entityInfo.entity),
      map(entityInfo => entityInfo.entity),
    );
  }

  fetchOrgs(cfGuid: string): Observable<APIResource<IOrganization>[]> {
    if (!this.cfOrgs[cfGuid]) {
      const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
      const orgs$ = cfEntityCatalog.org.store.getPaginationService(
        cfGuid,
        paginationKey,
        {
          includeRelations: [
            createEntityRelationKey(organizationEntityType, spaceEntityType)
          ], populateMissing: true
        }
      ).entities$
      this.cfOrgs[cfGuid] = CfRolesService.filterEditableOrgOrSpace<IOrganization>(this.userPerms, true, orgs$).pipe(
        map(orgs => orgs.sort((a, b) => a.entity.name.localeCompare(b.entity.name))),
        publishReplay(1),
        refCount()
      );
    }
    return this.cfOrgs[cfGuid];
  }

  /**
   * Compare a set of org or space permissions and return the differences
   */
  private comparePermissions(
    template: CfRoleChange,
    oldPerms: UserRoleInOrg | UserRoleInSpace,
    newPerms: UserRoleInOrg | UserRoleInSpace)
    : CfRoleChange[] {
    const changes = [];
    Object.keys(oldPerms).forEach(permKey => {
      if (newPerms[permKey] === undefined) {
        // Skip this, the user hasn't set it
        return;
      }
      if (!!oldPerms[permKey] !== !!newPerms[permKey]) {
        changes.push({
          ...template,
          add: !!newPerms[permKey],
          role: permKey
        });
      }
    });
    return changes;

  }

}
