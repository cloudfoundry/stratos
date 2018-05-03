import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  first,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
} from 'rxjs/operators';

import { IOrganization } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { GetOrganization } from '../../../../store/actions/organization.actions';
import { UsersRolesSetChanges } from '../../../../store/actions/users-roles.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../store/helpers/entity-relations.types';
import { createDefaultOrgRoles, createDefaultSpaceRoles } from '../../../../store/reducers/users-roles.reducer';
import {
  selectUsersRolesCf,
  selectUsersRolesPicked,
  selectUsersRolesRoles,
} from '../../../../store/selectors/users-roles.selector';
import { APIResource } from '../../../../store/types/api.types';
import { CfUser, IUserPermissionInOrg, UserRoleInOrg, UserRoleInSpace } from '../../../../store/types/user.types';
import { CfRoleChange, CfUserRolesSelected } from '../../../../store/types/users-roles.types';

@Injectable()
export class CfRolesService {

  existingRoles$: Observable<CfUserRolesSelected>;
  newRoles$: Observable<IUserPermissionInOrg>;
  loading$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private cfUserService: CfUserService,
    private entityServiceFactory: EntityServiceFactory) {
    this.existingRoles$ = this.store.select(selectUsersRolesPicked).pipe(
      combineLatest(this.store.select(selectUsersRolesCf)),
      filter(([users, cfGuid]) => !!cfGuid),
      switchMap(([users, cfGuid]) => {
        return this.populateRoles(cfGuid, users);
      }),
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
      combineLatest(this.newRoles$),
      map(([existingRoles, newRoles]) => !existingRoles || !newRoles),
      startWith(true)
    );
  }

  /**
   * Take the structure that cf stores user roles in (per user and flat) and convert into a format that's easier to use and compare with
   * (easier to access at specific levels, easier to parse pieces around)
   *
   * @param {string} cfGuid
   * @param {CfUser[]} selectedUsers
   * @returns {Observable<CfUserRolesSelected>}
   * @memberof CfRolesService
   */
  populateRoles(cfGuid: string, selectedUsers: CfUser[]): Observable<CfUserRolesSelected> {
    if (!cfGuid || !selectedUsers || selectedUsers.length === 0) {
      return Observable.of({});
    }

    const userGuids = selectedUsers.map(user => user.guid);

    return this.cfUserService.getUsers(cfGuid).pipe(
      map(users => {
        const roles = {};
        // For each user....
        users.forEach(user => {
          if (userGuids.indexOf(user.metadata.guid) < 0) {
            return;
          }
          const mappedUser = {};
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
            mappedUser[space.orgGuid].spaces[space.spaceGuid] = {
              ...space
            };
          });
          roles[user.metadata.guid] = mappedUser;
        });
        return roles;
      }),
    );
  }

  /**
   * Create a collection of role `change` items representing the diff between existing roles and newly selected roles.
   *
   * @param {string} orgGuid
   * @returns {Observable<CfRoleChange[]>}
   * @memberof CfRolesService
   */
  createRolesDiff(orgGuid: string): Observable<CfRoleChange[]> {
    return this.existingRoles$.pipe(
      combineLatest(this.newRoles$, this.store.select(selectUsersRolesPicked)),
      first(),
      map(([existingRoles, newRoles, pickedUsers]) => {
        const changes = [];

        // For each user, loop through the new roles and compare with any existing. If there's a diff, add it to a changes collection to be
        // returned
        pickedUsers.forEach(user => {
          const existingUserRoles = existingRoles[user.guid] || {};

          // Compare org roles
          const existingOrgRoles = existingUserRoles[orgGuid] || createDefaultOrgRoles(orgGuid);
          changes.push(...this.comparePermissions({
            userGuid: user.guid,
            orgGuid,
            add: false,
            role: null
          }, existingOrgRoles.permissions, newRoles.permissions));

          // Compare space roles
          Object.keys(newRoles.spaces).forEach(spaceGuid => {
            const newSpace = newRoles.spaces[spaceGuid];
            const oldSpace = existingOrgRoles.spaces[spaceGuid] || createDefaultSpaceRoles(orgGuid, spaceGuid);
            changes.push(...this.comparePermissions({
              userGuid: user.guid,
              orgGuid,
              spaceGuid,
              add: false,
              role: null
            }, oldSpace.permissions, newSpace.permissions));
          });
        });
        this.store.dispatch(new UsersRolesSetChanges(changes));
        return changes;
      })
    );
  }

  fetchOrg(cfGuid: string, orgGuid: string): Observable<APIResource<IOrganization>> {
    return this.entityServiceFactory.create<APIResource<IOrganization>>(
      organizationSchemaKey,
      entityFactory(organizationSchemaKey),
      orgGuid,
      new GetOrganization(orgGuid, cfGuid, [
        createEntityRelationKey(organizationSchemaKey, spaceSchemaKey)
      ], true),
      true
    ).waitForEntity$.pipe(
      filter(entityInfo => !!entityInfo.entity),
      map(entityInfo => entityInfo.entity),
    );
  }

  /**
   * Compare a set of org or space permissions and return the differences
   *
   * @private
   * @param {CfRoleChange} template
   * @param {(UserRoleInOrg | UserRoleInSpace)} oldPerms
   * @param {(UserRoleInOrg | UserRoleInSpace)} newPerms
   * @returns {CfRoleChange[]}
   * @memberof CfRolesService
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
