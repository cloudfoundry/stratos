import { Component, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { combineLatest as combineLatestOp, filter, first, map } from 'rxjs/operators';

import { UsersRolesSetOrgRole, UsersRolesSetSpaceRole } from '../../../../../cloud-foundry/src/actions/users-roles.actions';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { CfUserRolesSelected } from '../../../../../cloud-foundry/src/store/types/users-roles.types';
import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { canUpdateOrgSpaceRoles } from '../../../features/cloud-foundry/cf.helpers';
import { CfRolesService } from '../../../features/cloud-foundry/users/manage-users/cf-roles.service';
import {
  selectCfUsersIsRemove,
  selectCfUsersIsSetByUsername,
  selectCfUsersRolesPicked,
} from '../../../store/selectors/cf-users-roles.selector';
import {
  CfUser,
  IUserPermissionInOrg,
  IUserPermissionInSpace,
  OrgUserRoleNames,
  SpaceUserRoleNames,
} from '../../../store/types/cf-user.types';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';


enum CfRoleCheckboxMode {
  DEFAULT,
  ADD,
  REMOVE
}

/**
 * Component to manage the display and change of a specific org or space role. Will be checked if all users have role or user has selected
 * role to change. Will be `semi checked` if one but not all of the selected users have the role.
 * Special rules apply to an org user role. If there are any other roles set this will be disabled.
 *
 * @export
 */
@Component({
  selector: 'app-cf-role-checkbox',
  templateUrl: './cf-role-checkbox.component.html',
  styleUrls: ['./cf-role-checkbox.component.scss'],
})
export class CfRoleCheckboxComponent implements OnInit, OnDestroy {


  @Input() cfGuid: string;
  @Input() spaceGuid: string;
  @Input() orgName: string;
  @Input() spaceName: string;
  @Input() role: string;
  @Output() changed = new BehaviorSubject(false);

  mode$: Observable<CfRoleCheckboxMode>;
  modes = CfRoleCheckboxMode;

  checked = false;
  tooltip = '';
  sub: Subscription;
  isOrgRole = false;
  disabled = false;
  orgGuid: string;

  private static hasExistingRole(role: string, roles: CfUserRolesSelected, userGuid: string, orgGuid: string, spaceGuid: string): boolean {
    if (roles && roles[userGuid] && roles[userGuid][orgGuid]) {
      return !!this.hasRole(role, roles[userGuid][orgGuid], spaceGuid);
    }
    return false;
  }

  private static hasRole(role: string, orgRoles: IUserPermissionInOrg, spaceGuid: string): boolean {
    if (!orgRoles) {
      return undefined;
    }
    if (spaceGuid) {
      const spaceRoles = orgRoles.spaces[spaceGuid];
      return spaceRoles ? spaceRoles.permissions[role] : undefined;
    } else {
      return orgRoles.permissions[role];
    }
  }
  /**
   * Determine if the role has been assigned or selected
   * True - All selected users have this role OR user has selected this role
   * Null - Some selected users have this role
   * False - No user has this role OR user has unselected this role
   * Also provides a tooltip of comma separated users if not all selected user have the role
   */
  private static getCheckedState(
    role: string,
    users: CfUser[],
    existingRoles: CfUserRolesSelected,
    newRoles: IUserPermissionInOrg,
    orgGuid: string,
    spaceGuid?: string): {
      checked: boolean;
      tooltip: string;
    } {
    let tooltip = '';
    // Has the user set any state for this role? If so this overrides all other settings
    let checked = CfRoleCheckboxComponent.hasRole(role, newRoles, spaceGuid);
    if (checked !== undefined) {
      // User has set a state for this role, display it
      return { checked, tooltip };
    }

    // Is only one user selected? If so just display true/false given their existing roles
    if (users.length === 1) {
      checked = CfRoleCheckboxComponent.hasExistingRole(role, existingRoles, users[0].guid, orgGuid, spaceGuid);
      return { checked, tooltip };
    }

    // Do all selected users have this role (true) or only some (null)
    let oneWithout = false;
    tooltip = '';
    // Loop through users, determine who hasn't got the role and if there are any that don't
    for (const user of users) {
      if (CfRoleCheckboxComponent.hasExistingRole(role, existingRoles, user.guid, orgGuid, spaceGuid)) {
        tooltip += `${user.username}, `;
      } else {
        oneWithout = true;
      }
    }

    // Has all selected users not got the role?
    if (!tooltip.length) {
      // No user has the role
      return { checked: false, tooltip };
    }

    // Do all users have the role, or has one not got the role
    if (!oneWithout) {
      // All have role, no need to show the list of users
      checked = true;
      tooltip = '';
    } else {
      // At least one does not have role, tertiary state
      checked = null;
      tooltip = tooltip.substring(0, tooltip.length - 2);
    }

    return { checked, tooltip };
  }

  private static hasSpaceRole(
    users: CfUser[],
    existingRoles: CfUserRolesSelected,
    newRoles: IUserPermissionInOrg,
    orgGuid: string,
    spaces: { [guid: string]: IUserPermissionInSpace },
    checkedSpaces: Set<string>
  ): boolean {
    const spaceGuids = Object.keys(spaces || {});
    for (const spaceGuid of spaceGuids) {
      if (checkedSpaces.has(spaceGuid)) {
        continue;
      }
      const manager =
        CfRoleCheckboxComponent.getCheckedState(SpaceUserRoleNames.MANAGER, users, existingRoles, newRoles, orgGuid, spaceGuid);
      const developer =
        CfRoleCheckboxComponent.getCheckedState(SpaceUserRoleNames.DEVELOPER, users, existingRoles, newRoles, orgGuid, spaceGuid);
      const auditor =
        CfRoleCheckboxComponent.getCheckedState(SpaceUserRoleNames.AUDITOR, users, existingRoles, newRoles, orgGuid, spaceGuid);
      const hasSpaceRole = manager.checked !== false || developer.checked !== false || auditor.checked !== false;
      if (hasSpaceRole) {
        return true;
      }
      checkedSpaces.add(spaceGuid);
    }
  }

  private static hasOrgSpaceRole(
    users: CfUser[],
    existingRoles: CfUserRolesSelected,
    newRoles: IUserPermissionInOrg,
    orgGuid: string): boolean {
    if (!newRoles) {
      return false;
    }

    // Check all org roles, if any existing or new is set then return true
    const manager = CfRoleCheckboxComponent.getCheckedState(OrgUserRoleNames.MANAGER, users, existingRoles, newRoles, orgGuid);
    const billing = CfRoleCheckboxComponent.getCheckedState(OrgUserRoleNames.BILLING_MANAGERS, users, existingRoles, newRoles, orgGuid);
    const auditor = CfRoleCheckboxComponent.getCheckedState(OrgUserRoleNames.AUDITOR, users, existingRoles, newRoles, orgGuid);
    if (manager.checked !== false || billing.checked !== false || auditor.checked !== false) {
      return true;
    }

    // Check all space roles
    // .. first check new space roles
    const checkedSpaces = new Set<string>();
    if (CfRoleCheckboxComponent.hasSpaceRole(users, existingRoles, newRoles, orgGuid, newRoles.spaces, checkedSpaces)) {
      return true;
    }

    // .. second check existing space roles
    const existingUserGuids = Object.keys(existingRoles);
    for (const existingUserGuid of existingUserGuids) {
      const orgs = existingRoles[existingUserGuid];
      const org = orgs[orgGuid];
      if (!org) {
        continue;
      }
      if (CfRoleCheckboxComponent.hasSpaceRole(users, existingRoles, newRoles, orgGuid, org.spaces, checkedSpaces)) {
        return true;
      }
    }

    return false;
  }
  /**
   * Determine if the checkbox should be disabled. This is only relevant to the Org User role which should be disabled if there are any
   * existing or new org or space roles set
   *
   * @returns True if the checkbox should be disabled
   */
  private static isDisabled(
    isOrgRole: boolean,
    role: string,
    users: CfUser[],
    existingRoles: CfUserRolesSelected,
    newRoles: IUserPermissionInOrg,
    orgGuid: string,
    checked: boolean,
    isSetByUsername: boolean): boolean {
    if (isOrgRole && role === OrgUserRoleNames.USER) {
      // If this is in username mode never disable the user checkbox
      if (isSetByUsername) {
        return false;
      }
      // Never disable the org user checkbox if it's not enabled/semi enabled (covers odd cases when cf creates orgs/spaces without the
      // permissions)
      const isChecked = checked === true || checked === null;
      if (!isChecked) {
        return false;
      }

      // Check all org and space roles, are there any set? If so we should disable the org user checkbox
      return CfRoleCheckboxComponent.hasOrgSpaceRole(users, existingRoles, newRoles, orgGuid);
    }
    return false;
  }

  constructor(
    private cfRolesService: CfRolesService,
    private store: Store<CFAppState>,
    private userPerms: CurrentUserPermissionsService
  ) { }

  ngOnInit() {
    this.isOrgRole = !this.spaceGuid;
    const users$ = this.store.select(selectCfUsersRolesPicked);
    // If setting an org role user must be admin or org manager.
    // If setting a space role user must be admin, org manager or space manager
    const canEditRole$ = this.isOrgRole ?
      this.userPerms.can(CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, this.cfGuid, this.orgGuid) :
      canUpdateOrgSpaceRoles(
        this.userPerms,
        this.cfGuid,
        this.orgGuid,
        this.spaceGuid);
    const selectUsersIsSetByUsername$ = this.store.select(selectCfUsersIsSetByUsername);

    this.sub = this.cfRolesService.existingRoles$.pipe(
      combineLatestOp(this.cfRolesService.newRoles$, users$, canEditRole$, selectUsersIsSetByUsername$),
      filter(([existingRoles, newRoles, users, canEditRole, isSetByUsername]) => !!users.length && !!newRoles.orgGuid)
    ).subscribe(([existingRoles, newRoles, users, canEditRole, isSetByUsername]) => {
      this.orgGuid = newRoles.orgGuid;
      const { checked, tooltip } = CfRoleCheckboxComponent.getCheckedState(
        this.role, users, existingRoles, newRoles, this.orgGuid, this.spaceGuid);
      this.checked = checked;
      this.tooltip = tooltip;
      this.disabled = !canEditRole ||
        CfRoleCheckboxComponent.isDisabled(
          this.isOrgRole,
          this.role,
          users,
          existingRoles,
          newRoles,
          this.orgGuid,
          checked,
          isSetByUsername
        );
    });

    this.mode$ = combineLatest([
      this.store.select(selectCfUsersIsSetByUsername),
      this.store.select(selectCfUsersIsRemove)
    ]).pipe(
      map(([isSetByUsername, isRemove]) => {
        if (!isSetByUsername) {
          return CfRoleCheckboxMode.DEFAULT;
        }
        return isRemove ? CfRoleCheckboxMode.REMOVE : CfRoleCheckboxMode.ADD;
      })
    );
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  public roleUpdated(checked: boolean) {
    this.checked = checked;
    this.cfRolesService.newRoles$.pipe(
      first()
    ).subscribe(newRoles => {
      if (!checked) {
        this.tooltip = '';
      }
      if (this.isOrgRole) {
        this.store.dispatch(new UsersRolesSetOrgRole(this.orgGuid, this.orgName, this.role, checked));
      } else {
        this.store.dispatch(new UsersRolesSetSpaceRole(this.orgGuid, this.orgName, this.spaceGuid, this.spaceName, this.role, checked));
      }
    });
  }

}
