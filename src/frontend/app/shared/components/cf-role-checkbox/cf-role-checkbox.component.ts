import { Component, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { combineLatest, filter, first } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { CfRolesService } from '../../../features/cloud-foundry/users/manage-users/cf-roles.service';
import { UsersRolesSetOrgRole, UsersRolesSetSpaceRole } from '../../../store/actions/users-roles.actions';
import { AppState } from '../../../store/app-state';
import { selectUsersRolesPicked } from '../../../store/selectors/users-roles.selector';
import {
  CfUser,
  IUserPermissionInOrg,
  IUserPermissionInSpace,
  OrgUserRoleNames,
  SpaceUserRoleNames,
} from '../../../store/types/user.types';
import { CfUserRolesSelected, UserRoleLabels } from '../../../store/types/users-roles.types';

@Component({
  selector: 'app-cf-role-checkbox',
  templateUrl: './cf-role-checkbox.component.html',
  styleUrls: ['./cf-role-checkbox.component.scss'],
})
export class CfRoleCheckboxComponent implements OnInit, OnDestroy {


  @Input() spaceGuid: string;
  @Input() role: string;
  @Output() changed = new BehaviorSubject(false);

  checked: Boolean = false;
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

  private static hasRole(role: string, orgRoles: IUserPermissionInOrg, spaceGuid: string): Boolean {
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

  private static getCheckedState(
    role: string,
    users: CfUser[],
    existingRoles: CfUserRolesSelected,
    newRoles: IUserPermissionInOrg,
    orgGuid: string,
    spaceGuid?: string): {
      checked: Boolean;
      tooltip: string;
    } {
    let tooltip = '';
    // Has the user set any state for this role?
    let checked = CfRoleCheckboxComponent.hasRole(role, newRoles, spaceGuid);
    // No? Has the user got a existing/previous state for this role?
    if (checked === undefined) { //
      // Do all or some have the role?
      if (users.length === 1) {
        const userGuid = users[0].guid;
        checked = CfRoleCheckboxComponent.hasExistingRole(role, existingRoles, userGuid, orgGuid, spaceGuid);
      } else {
        let oneWithout = false;
        tooltip = '';
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          if (CfRoleCheckboxComponent.hasExistingRole(role, existingRoles, user.guid, orgGuid, spaceGuid)) {
            tooltip += `${user.username}, `;
          } else {
            oneWithout = true;
          }
        }

        // Does any one of these users have this role?
        if (tooltip.length) {
          // Do all users have the role, or has one not got the role
          if (!oneWithout) {
            // All have role
            checked = true;
            // All have this state, no need to show the list of users
            tooltip = '';
          } else {
            // At least one does not have role, tertiary state
            checked = null;
            tooltip = tooltip.substring(0, tooltip.length - 2);
          }
        } else {
          // No user has the role
          checked = false;
        }
      }
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
    for (let y = 0; y < spaceGuids.length; y++) {
      const spaceGuid = spaceGuids[y];
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
    const hasOrgRole = manager.checked !== false || billing.checked !== false || auditor.checked !== false;
    if (hasOrgRole) {
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
    for (let x = 0; x < existingUserGuids.length; x++) {
      const orgs = existingRoles[existingUserGuids[x]];
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
   * @private
   * @static
   * @param {boolean} isOrgRole
   * @param {string} role
   * @param {CfUser[]} users
   * @param {CfUserRolesSelected} existingRoles
   * @param {IUserPermissionInOrg} newRoles
   * @param {string} orgGuid
   * @param {Boolean} checked
   * @returns {boolean} True if the checkbox should be disabled
   * @memberof CfRoleCheckboxComponent
   */
  private static isDisabled(
    isOrgRole: boolean,
    role: string,
    users: CfUser[],
    existingRoles: CfUserRolesSelected,
    newRoles: IUserPermissionInOrg,
    orgGuid: string,
    checked: Boolean): boolean {
    if (isOrgRole && role === OrgUserRoleNames.USER) {
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


  constructor(private cfRolesService: CfRolesService, private store: Store<AppState>) { }

  ngOnInit() {
    this.isOrgRole = !this.spaceGuid;
    const users$ = this.store.select(selectUsersRolesPicked);
    this.sub = this.cfRolesService.existingRoles$.pipe(
      combineLatest(this.cfRolesService.newRoles$, users$),
      filter(([existingRoles, newRoles, users]) => !!users.length && !!newRoles.orgGuid)
    ).subscribe(([existingRoles, newRoles, users]) => {
      this.orgGuid = newRoles.orgGuid;
      const { checked, tooltip } = CfRoleCheckboxComponent.getCheckedState(
        this.role, users, existingRoles, newRoles, this.orgGuid, this.spaceGuid);
      this.checked = checked;
      this.tooltip = tooltip;
      // this.disabled = this.isOrgRole && this.role === OrgUserRoleNames.USER && (checked === true || checked === null);
      this.disabled = CfRoleCheckboxComponent.isDisabled(this.isOrgRole, this.role, users, existingRoles, newRoles, this.orgGuid, checked);
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  public getLabel(): string {
    return this.spaceGuid ? '' : UserRoleLabels.org.long[this.role];
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
        this.store.dispatch(new UsersRolesSetOrgRole(this.orgGuid, this.role, checked));
      } else {
        this.store.dispatch(new UsersRolesSetSpaceRole(this.orgGuid, this.spaceGuid, this.role, checked));
      }
    });
  }

}
