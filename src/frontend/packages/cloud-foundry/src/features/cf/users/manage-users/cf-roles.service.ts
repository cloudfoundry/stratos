import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, Observable, of as observableOf, of } from 'rxjs';
import { take,
  catchError,
  combineLatest as combineLatestOperators,
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
} from 'rxjs/operators';

import { naturalCompare } from '@stratosui/core';

import { CurrentUserPermissionsService } from '../../../../../../core/src/core/permissions/current-user-permissions.service';
import { APIResource, EntityInfo } from '../../../../../../store/src/types/api.types';
import { IOrganization, ISpace } from '../../../../cf-api.types';
import { CfUsersRolesDataService } from '../../../../services/domain-data/cf-users-roles-data.service';
import { StOrg, StOrgDetail } from '../../../../services/endpoint-data/stratos-types';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { createDefaultOrgRoles, createDefaultSpaceRoles } from '../../../../store/reducers/cf-users-roles.reducer';
import { CfUser, IUserPermissionInOrg, OrgUserRoleNames, SpaceUserRoleNames, UserRoleInOrg, UserRoleInSpace } from '../../../../store/types/cf-user.types';
import { CfRoleChange, CfUserRolesSelected } from '../../../../store/types/users-roles.types';
import { CfUserPermissionsChecker } from '../../../../user-permissions/cf-user-permissions-checkers';
import { canUpdateOrgSpaceRoles } from '../../cf.helpers';

function adaptOrgToApiResource(org: StOrg | StOrgDetail): APIResource<IOrganization> {
  return {
    metadata: {
      guid: org.guid,
      url: '',
      created_at: org.createdAt ?? '',
      updated_at: org.updatedAt ?? '',
    },
    entity: {
      name: org.name,
      guid: org.guid,
      cfGuid: org.cnsiGuid,
    } as IOrganization,
  };
}

@Injectable({
  providedIn: 'root'
})
export class CfRolesService {
  private cfUserService = inject(CfUserService);
  private userPerms = inject(CurrentUserPermissionsService);
  private rolesData = inject(CfUsersRolesDataService);
  private http = inject(HttpClient);


  existingRoles$: Observable<CfUserRolesSelected>;
  newRoles$: Observable<IUserPermissionInOrg>;
  loading$: Observable<boolean>;
  cfOrgs: { [cfGuid: string]: Observable<APIResource<IOrganization>[]>, } = {};
  private users$: Observable<CfUser[]>;

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
            isOrg ? CfUserPermissionsChecker.ALL_SPACES : orgOrSpace.metadata.guid,
          ))));
      }),
      // Filter out orgs than the current user cannot edit
      map(([orgs, canEdit]) => orgs.filter(org => canEdit.find(canEditOrgOrSpace => canEditOrgOrSpace.guid === org.metadata.guid).canEdit)),
    );
  }

  /**
   * Create an observable with an org/space guids and whether it can be edited by the connected user
   */
  static canEditOrgOrSpace(
    userPerms: CurrentUserPermissionsService,
    guid: string,
    cfGuid: string,
    orgGuid: string,
    spaceGuid: string): Observable<{ guid: string, canEdit: boolean, }> {
    return canUpdateOrgSpaceRoles(userPerms, cfGuid, orgGuid, spaceGuid).pipe(
      take(1),
      map(canEdit => ({ guid, canEdit }))
    );
  }

  constructor() {
    this.users$ = toObservable(this.rolesData.users);
    this.existingRoles$ = this.users$.pipe(
      combineLatestOperators(toObservable(this.rolesData.cfGuid)),
      filter(([_users, cfGuid]) => !!cfGuid),
      switchMap(([users, cfGuid]) => this.populateRoles(cfGuid, users)),
      distinctUntilChanged(),
      publishReplay(1),
      refCount()
    );
    this.newRoles$ = toObservable(this.rolesData.newRoles).pipe(
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
    const mappedUser: { [orgGuid: string]: IUserPermissionInOrg, } = {};
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
        this.users$,
      ),
      take(1),
      map(([existingRoles, newRoles, pickedUsers]) => {
        const changes: CfRoleChange[] = [];
        // For each user, loop through the new roles and compare with any existing. If there's a diff, add it to a changes collection to be
        // returned
        pickedUsers.forEach(user => {
          changes.push(...this.createRolesUserDiff(existingRoles, newRoles, changes, user, orgGuid));
        });
        this.rolesData.setChanges(changes);
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

  // V2-shape adapter — manage-users UI was written against ngrx EntityInfo /
  // APIResource<IOrganization>. Bridging the native StOrg payload into that
  // shape here keeps the UI files unchanged; a future cleanup can lift the
  // native shape through the consumers.
  fetchOrg(cfGuid: string, orgGuid: string): Observable<EntityInfo<APIResource<IOrganization>>> {
    const fetching: EntityInfo<APIResource<IOrganization>> = {
      entity: null,
      entityRequestInfo: {
        fetching: true,
        error: false,
        deleting: { busy: false, deleted: false, error: false, message: '' },
      } as any,
    };
    return this.http.get<StOrgDetail>(`/pp/v1/cf/org/${cfGuid}/${orgGuid}`).pipe(
      map(detail => ({
        entity: adaptOrgToApiResource(detail),
        entityRequestInfo: {
          fetching: false,
          error: false,
          deleting: { busy: false, deleted: false, error: false, message: '' },
        } as any,
      }) as EntityInfo<APIResource<IOrganization>>),
      startWith(fetching),
      catchError(() => of({
        entity: null,
        entityRequestInfo: {
          fetching: false,
          error: true,
          deleting: { busy: false, deleted: false, error: false, message: '' },
        } as any,
      } as EntityInfo<APIResource<IOrganization>>)),
    );
  }

  fetchOrgEntity(cfGuid: string, orgGuid: string): Observable<APIResource<IOrganization>> {
    return this.fetchOrg(cfGuid, orgGuid).pipe(
      filter(entityInfo => !!entityInfo.entity),
      map(entityInfo => entityInfo.entity),
    );
  }

  fetchOrgs(cfGuid: string): Observable<APIResource<IOrganization>[]> {
    if (!this.cfOrgs[cfGuid]) {
      const orgs$ = this.http.get<{ resources: StOrg[]; totalResults: number }>(
        `/pp/v1/cf/orgs/${cfGuid}?per_page=500`,
      ).pipe(
        map(resp => (resp?.resources ?? []).map(adaptOrgToApiResource)),
        catchError(() => of([] as APIResource<IOrganization>[])),
      );
      this.cfOrgs[cfGuid] = CfRolesService.filterEditableOrgOrSpace<IOrganization>(this.userPerms, true, orgs$).pipe(
        map(orgs => orgs.sort((a, b) => naturalCompare(a.entity.name, b.entity.name))),
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
    const changes: CfRoleChange[] = [];
    Object.keys(oldPerms).forEach(permKey => {
      if (newPerms[permKey] === undefined) {
        // Skip this, the user hasn't set it
        return;
      }
      if (!!oldPerms[permKey] !== !!newPerms[permKey]) {
        changes.push({
          ...template,
          add: !!newPerms[permKey],
          role: permKey as OrgUserRoleNames | SpaceUserRoleNames
        });
      }
    });
    return changes;

  }

}
