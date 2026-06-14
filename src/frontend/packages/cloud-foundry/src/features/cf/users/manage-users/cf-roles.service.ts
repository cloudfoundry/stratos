import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, from, Observable, of as observableOf, of } from 'rxjs';
import { take,
  catchError,
  combineLatest as combineLatestOperators,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  publishReplay,
  reduce,
  refCount,
  startWith,
  switchMap,
} from 'rxjs/operators';

import { naturalCompare } from '@stratosui/core';

import { CurrentUserPermissionsService } from '../../../../../../core/src/core/permissions/current-user-permissions.service';
import { APIResource, EntityInfo } from '../../../../../../store/src/types/api.types';
import { IOrganization, ISpace } from '../../../../cf-api.types';
import { CfUsersRolesDataService } from '../../../../services/domain-data/cf-users-roles-data.service';
import { StOrg, StOrgDetail, StSpace, StUser } from '../../../../services/endpoint-data/stratos-types';
import { orgRolesFromStUser, spaceRolesFromStUser } from '../../../../shared/data-services/st-user-roles';
import { createDefaultOrgRoles, createDefaultSpaceRoles } from '../../../../services/domain-data/cf-users-roles-data.service';
import { IUserPermissionInOrg, OrgUserRoleNames, SpaceUserRoleNames, UserRoleInOrg, UserRoleInSpace } from '../../../../store/types/cf-user.types';
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
  private userPerms = inject(CurrentUserPermissionsService);
  private rolesData = inject(CfUsersRolesDataService);
  private http = inject(HttpClient);


  existingRoles$: Observable<CfUserRolesSelected>;
  newRoles$: Observable<IUserPermissionInOrg>;
  loading$: Observable<boolean>;
  cfOrgs: { [cfGuid: string]: Observable<APIResource<IOrganization>[]>, } = {};
  private cfOrgNames: { [cfGuid: string]: Observable<StOrg[]>, } = {};
  private cfSpaces: { [cfGuid: string]: Observable<StSpace[]>, } = {};
  private users$: Observable<StUser[]>;

  /**
   * Given a list of orgs or spaces remove those that the connected user cannot edit roles in.
   */
  static filterEditableOrgOrSpace<T extends IOrganization | ISpace>(
    userPerms: CurrentUserPermissionsService,
    isOrg: boolean,
    orgOrSpaces$: Observable<APIResource<T>[]>,
    cfGuid: string,
  ): Observable<APIResource<T>[]> {
    return orgOrSpaces$.pipe(
      // Create an observable containing the original list of organisations and a corresponding list of whether an org can be edited
      switchMap(orgsOrSpaces => {
        return combineLatest(
          observableOf(orgsOrSpaces),
          combineLatest(orgsOrSpaces.map(orgOrSpace => CfRolesService.canEditOrgOrSpace(
            userPerms,
            orgOrSpace.metadata.guid,
            // entity.cfGuid is typed optional on IOrganization/ISpace; the cnsi
            // is always known by the caller, so fall back to it.
            orgOrSpace.entity.cfGuid ?? cfGuid,
            isOrg ? orgOrSpace.metadata.guid : ((orgOrSpace as APIResource<ISpace>).entity.organization_guid),
            isOrg ? CfUserPermissionsChecker.ALL_SPACES : orgOrSpace.metadata.guid,
          ))));
      }),
      // Filter out orgs than the current user cannot edit
      map(([orgs, canEdit]) => orgs.filter(org => {
        const entry = canEdit.find(canEditOrgOrSpace => canEditOrgOrSpace.guid === org.metadata.guid);
        return !!entry && entry.canEdit;
      })),
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
  populateRoles(cfGuid: string, selectedUsers: StUser[]): Observable<CfUserRolesSelected> {
    if (!cfGuid || !selectedUsers || selectedUsers.length === 0) {
      return observableOf({});
    }

    // The picked users are already the fully-drained StUser rows (org/space
    // role buckets carry the prefix-stripped role names per scope), so there's
    // no per-user re-fetch. The buckets hold guids only, so the org/space
    // *names* are resolved from the native list endpoints via the unfiltered
    // name-lookup fetches (fetchOrgNames / fetchSpaces). These deliberately
    // bypass fetchOrgs' editability filter — that filter belongs where roles
    // are applied, not where display names are resolved, and it would otherwise
    // leave existingRoles$ never emitting for empty/non-editable org lists.
    return combineLatest([this.fetchOrgNames(cfGuid), this.fetchSpaces(cfGuid)]).pipe(
      take(1),
      map(([orgs, spaces]) => {
        const orgNameByGuid = new Map<string, string>(orgs.map(o => [o.guid, o.name]));
        const spaceNameByGuid = new Map<string, string>(spaces.map(s => [s.guid, s.name]));
        const roles: CfUserRolesSelected = {};
        selectedUsers.forEach(user => this.populateUserRoles(user, roles, orgNameByGuid, spaceNameByGuid));
        return roles;
      }),
    );
  }

  private populateUserRoles(
    user: StUser,
    roles: CfUserRolesSelected,
    orgNameByGuid: Map<string, string>,
    spaceNameByGuid: Map<string, string>,
  ) {
    const mappedUser: { [orgGuid: string]: IUserPermissionInOrg, } = {};
    const orgRoles = orgRolesFromStUser(user, orgNameByGuid);
    const spaceRoles = spaceRolesFromStUser(user, orgNameByGuid, spaceNameByGuid);
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
      const orgEntry = mappedUser[space.orgGuid];
      if (!space.orgName) {
        space.orgName = orgEntry.name;
      }
      // Both construction paths above (the org-roles loop and
      // createDefaultOrgRoles) initialise `spaces` to {}; guard so TS sees it.
      if (!orgEntry.spaces) {
        orgEntry.spaces = {};
      }
      orgEntry.spaces[space.spaceGuid] = {
        ...space
      };
    });
    roles[user.guid] = mappedUser;
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
    user: StUser,
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
    },
      existingOrgRoles.permissions, newRoles.permissions));

    // Compare space roles
    const newSpaces = newRoles.spaces;
    const existingSpaces = existingOrgRoles.spaces;
    if (!newSpaces) {
      return newChanges;
    }
    Object.keys(newSpaces).forEach(spaceGuid => {
      const newSpace = newSpaces[spaceGuid];
      const oldSpace = (existingSpaces && existingSpaces[spaceGuid]) ||
        createDefaultSpaceRoles(orgGuid, newRoles.name, spaceGuid, newSpace.name);
      newChanges.push(...this.comparePermissions({
        userGuid: user.guid,
        orgGuid,
        orgName: newRoles.name,
        spaceGuid,
        spaceName: newSpace.name,
      },
        oldSpace.permissions, newSpace.permissions));
    });

    return newChanges;
  }

  // V2-shape adapter — manage-users UI was written against ngrx EntityInfo /
  // APIResource<IOrganization>. Bridging the native StOrg payload into that
  // shape here keeps the UI files unchanged; a future cleanup can lift the
  // native shape through the consumers.
  fetchOrg(cfGuid: string, orgGuid: string): Observable<EntityInfo<APIResource<IOrganization> | null>> {
    const fetching: EntityInfo<APIResource<IOrganization> | null> = {
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
      }) as EntityInfo<APIResource<IOrganization> | null>),
      startWith(fetching),
      catchError(() => of({
        entity: null,
        entityRequestInfo: {
          fetching: false,
          error: true,
          deleting: { busy: false, deleted: false, error: false, message: '' },
        } as any,
      } as EntityInfo<APIResource<IOrganization> | null>)),
    );
  }

  fetchOrgEntity(cfGuid: string, orgGuid: string): Observable<APIResource<IOrganization>> {
    return this.fetchOrg(cfGuid, orgGuid).pipe(
      filter((entityInfo): entityInfo is EntityInfo<APIResource<IOrganization>> => !!entityInfo.entity),
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
      this.cfOrgs[cfGuid] = CfRolesService.filterEditableOrgOrSpace<IOrganization>(this.userPerms, true, orgs$, cfGuid).pipe(
        map(orgs => orgs.sort((a, b) => naturalCompare(a.entity.name, b.entity.name))),
        publishReplay(1),
        refCount()
      );
    }
    return this.cfOrgs[cfGuid];
  }

  /**
   * Native org list used purely as a guid→name lookup when mapping a user's
   * StUser org-role buckets into the wizard's `existingRoles` shape. Unlike
   * fetchOrgs this is not editable-filtered (and so always emits) — it only
   * supplies display names; role editability is enforced downstream where the
   * changes are applied.
   */
  private fetchOrgNames(cfGuid: string): Observable<StOrg[]> {
    if (!this.cfOrgNames[cfGuid]) {
      this.cfOrgNames[cfGuid] = this.drainCfList<StOrg>(`/pp/v1/cf/orgs/${cfGuid}`).pipe(
        catchError(() => of([] as StOrg[])),
        publishReplay(1),
        refCount(),
      );
    }
    return this.cfOrgNames[cfGuid];
  }

  // Drains EVERY page of a native /pp/v1/cf list endpoint into one array. The
  // native handler is a single-CAPI-page passthrough (forwards per_page/page),
  // so a name lookup must page through all results — a single per_page=500 call
  // would silently miss orgs/spaces past the first 500 on large foundations.
  // Page 1 inline, pages 2..N fanned at concurrency 4 (mirrors the
  // EndpointDataService / CfUsersPagedDataService drains). totalPages is derived
  // from the flat { resources, totalResults } envelope these endpoints return.
  private drainCfList<T>(urlBase: string): Observable<T[]> {
    const perPage = 500;
    const fetchPage = (page: number) =>
      this.http.get<{ resources: T[]; totalResults?: number }>(`${urlBase}?per_page=${perPage}&page=${page}`).pipe(
        map(resp => ({ resources: resp?.resources ?? [], totalResults: resp?.totalResults })),
      );
    return fetchPage(1).pipe(
      switchMap(first => {
        const total = first.totalResults ?? first.resources.length;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        if (totalPages <= 1) {
          return of(first.resources);
        }
        const rest = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        return from(rest).pipe(
          mergeMap(page => fetchPage(page).pipe(map(r => r.resources)), 4),
          reduce((acc, res) => [...acc, ...res], [...first.resources]),
        );
      }),
    );
  }

  /**
   * Native space list used purely as a guid→name lookup when mapping a user's
   * StUser space-role buckets into the wizard's `existingRoles` shape. Unlike
   * fetchOrgs this is not editable-filtered — it only supplies display names;
   * role editability is enforced downstream where the changes are applied.
   */
  private fetchSpaces(cfGuid: string): Observable<StSpace[]> {
    if (!this.cfSpaces[cfGuid]) {
      this.cfSpaces[cfGuid] = this.drainCfList<StSpace>(`/pp/v1/cf/spaces/${cfGuid}`).pipe(
        catchError(() => of([] as StSpace[])),
        publishReplay(1),
        refCount(),
      );
    }
    return this.cfSpaces[cfGuid];
  }

  /**
   * Compare a set of org or space permissions and return the differences
   */
  private comparePermissions(
    template: Omit<CfRoleChange, 'add' | 'role'>,
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
