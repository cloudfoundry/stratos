import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest as obsCombineLatest, Observable, of as observableOf } from 'rxjs';
import { combineLatest, filter, first, map, startWith } from 'rxjs/operators';

import { LoggerService } from '../../../../../../core/src/core/logger.service';
import { CurrentUserPermissionsService } from '../../../../../../core/src/core/permissions/current-user-permissions.service';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import {
  UsersRolesClear,
  UsersRolesExecuteChanges,
  UsersRolesSetChanges,
  UsersRolesSetUsers,
} from '../../../../actions/users-roles.actions';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { selectCfUsersRoles } from '../../../../store/selectors/cf-users-roles.selector';
import { CfUser, IUserPermissionInOrg, IUserPermissionInSpace } from '../../../../store/types/cf-user.types';
import { CfRoleChange } from '../../../../store/types/users-roles.types';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { CfRolesService } from '../manage-users/cf-roles.service';

@Component({
  selector: 'app-remove-user',
  templateUrl: './remove-user.component.html',
  styleUrls: ['./remove-user.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CfRolesService
  ]
})
export class RemoveUserComponent implements OnDestroy {
  initialUsers$: Observable<CfUser[]>;
  singleUser$: Observable<CfUser>;
  defaultCancelUrl: string;
  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
  applyStarted = false;
  onlySpaces = false;
  isBlocked$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfUserService: CfUserService,
    private cfRolesService: CfRolesService,
    private logService: LoggerService,
    private route: ActivatedRoute,
    private userPerms: CurrentUserPermissionsService
  ) {
    this.defaultCancelUrl = this.createReturnUrl(activeRouteCfOrgSpace);
    this.cfGuid = this.activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = this.activeRouteCfOrgSpace.orgGuid;
    this.spaceGuid = this.activeRouteCfOrgSpace.spaceGuid;
    this.onlySpaces = this.route.snapshot.queryParams.spaces === 'true';

    const userQParam = this.route.snapshot.queryParams.user;
    if (userQParam) {
      this.singleUser$ = this.cfUserService.getUser(activeRouteCfOrgSpace.cfGuid, userQParam)
        .pipe(
          map(user => user.entity),
          first()
        );
    } else {
      this.logService.error('User param not defined');
      return;
    }

    const cfGuid$ = this.store.select(selectCfUsersRoles).pipe(
      combineLatest(this.singleUser$),
      first()
    );
    // Ensure that when we arrive here directly the store is set up with all it needs
    cfGuid$.subscribe(([usersRoles, user]) => {
      if (!usersRoles.cfGuid || !user) {
        this.store.dispatch(new UsersRolesSetUsers(activeRouteCfOrgSpace.cfGuid, [user]));
      }
    });

    this.isBlocked$ = cfGuid$.pipe(
      filter(res => !!res),
      map(() => false),
      startWith(true),
    );

    this.cfRolesService.existingRoles$.pipe(
      combineLatest(this.singleUser$),
      first(),
    ).subscribe(([existingRoles, user]) => {
      const orgs = existingRoles[user.guid];
      const changes = this.getRolesChanges(user, orgs);

      obsCombineLatest(...this.getChangesObservables(changes)).pipe(
        map(([...canChanges]) => canChanges),
        first()
      ).subscribe((canChanges) => {
        const allowedChanges = canChanges.filter((c) => c.can).map(c => c.change);
        this.store.dispatch(new UsersRolesSetChanges(allowedChanges));
      });
    });
  }

  ngOnDestroy(): void {
    this.store.dispatch(new UsersRolesClear());
  }

  getChangesObservables(changes: CfRoleChange[]) {
    return changes.map((c) => {
      const isOrgRole = !c.spaceGuid;

      if (isOrgRole) {
        return this.userPerms.can(CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, this.cfGuid, c.orgGuid).pipe(
          map((can) => ({ can, change: c }))
        );
      }

      return this.userPerms.can(CfCurrentUserPermissions.SPACE_CHANGE_ROLES, this.cfGuid, c.orgGuid, c.spaceGuid).pipe(
        map((can) => ({ can, change: c }))
      );
    });
  }

  getRolesChanges(user: CfUser, orgs) {
    const changes = [];
    const orgGuids = this.orgGuid ? [this.orgGuid] : Object.keys(orgs);

    for (const orgGuid of orgGuids) {
      const org: IUserPermissionInOrg = orgs[orgGuid];

      changes.push(...this.getOrgRolesChanges(user, org));
      changes.push(...this.getSpacesRolesChanges(user, org.spaces));
    }

    return changes;
  }

  getOrgRolesChanges(user: CfUser, org: IUserPermissionInOrg) {
    const changes = [];

    if (!this.spaceGuid && !this.onlySpaces) {
      const roles = org.permissions;

      for (const role of Object.keys(roles)) {
        const assigned = roles[role];

        if (assigned) {
          changes.push({
            userGuid: user.guid,
            orgGuid: org.orgGuid,
            orgName: org.name,
            add: false,
            role,
          });
        }
      }
    }

    return changes;
  }

  getSpacesRolesChanges(user: CfUser, spaces) {
    const changes = [];
    const spaceGuids = this.spaceGuid ? [this.spaceGuid] : Object.keys(spaces);

    for (const spaceGuid of spaceGuids) {
      const space: IUserPermissionInSpace = spaces[spaceGuid];
      const roles = space.permissions;

      for (const role of Object.keys(roles)) {
        const assigned = roles[role];

        if (assigned) {
          changes.push({
            userGuid: user.guid,
            orgGuid: space.orgGuid,
            orgName: space.orgName,
            spaceGuid,
            spaceName: space.name,
            add: false,
            role,
          });
        }
      }
    }

    return changes;
  }

  /**
   * Determine where the return url should be. This will only apply when user visits modal directly (otherwise stepper uses previous state)
   */
  createReturnUrl(activeRouteCfOrgSpace: ActiveRouteCfOrgSpace): string {
    let route = `/cloud-foundry/${activeRouteCfOrgSpace.cfGuid}`;
    if (this.activeRouteCfOrgSpace.orgGuid) {
      route += `/organizations/${activeRouteCfOrgSpace.orgGuid}`;
      if (this.activeRouteCfOrgSpace.spaceGuid) {
        route += `/spaces/${activeRouteCfOrgSpace.spaceGuid}`;
      }
    }
    route += `/users`;
    return route;
  }

  startApply: StepOnNextFunction = () => {
    if (this.applyStarted) {
      return observableOf({ success: true, redirect: true });
    }
    this.applyStarted = true;
    this.store.dispatch(new UsersRolesExecuteChanges());
    return observableOf({ success: true, ignoreSuccess: true });
  }
}
