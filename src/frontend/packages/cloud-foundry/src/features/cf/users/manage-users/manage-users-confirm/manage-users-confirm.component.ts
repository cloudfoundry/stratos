import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subject } from 'rxjs';
import { take, distinctUntilChanged, filter, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';

import { naturalCompare } from '@stratosui/core';
import { CfUsersRolesDataService, RoleChangeApplyState } from '../../../../../services/domain-data/cf-users-roles-data.service';
import {
  TableCellConfirmOrgSpaceComponent } from './table-cell-confirm-org-space/table-cell-confirm-org-space.component';
import {
  TableCellConfirmRoleAddRemComponent } from './table-cell-confirm-role-add-rem/table-cell-confirm-role-add-rem.component';
import { CfUsersPagedDataService } from '../../../../../shared/data-services/cf-users-paged-data.service';
import { StUser } from '../../../../../services/endpoint-data/stratos-types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../../../store/types/cf-user.types';
import { CfRoleChangeWithNames, UserRoleLabels } from '../../../../../store/types/users-roles.types';
import { ManageUsersSetUsernamesHelper } from '../manage-users-set-usernames/manage-users-set-usernames.component';

@Component({
  selector: 'app-manage-users-confirm',
  templateUrl: './manage-users-confirm.component.html',
  styleUrls: ['./manage-users-confirm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TableCellConfirmRoleAddRemComponent,
    TableCellConfirmOrgSpaceComponent,
  ]
})
export class UsersRolesConfirmComponent implements OnInit, AfterContentInit {
  private usersData = inject(CfUsersPagedDataService);
  private rolesData = inject(CfUsersRolesDataService);
  // Cached toObservable bridges so handlers can use them outside the
  // injection context.
  private state$ = toObservable(this.rolesData.state);
  private changedRoles$ = toObservable(this.rolesData.changedRoles);

  @Input() setUsernames = false;

  changes$!: Observable<CfRoleChangeWithNames[]>;

  private cfGuid$: Observable<string>;
  public orgName$: Observable<string>;

  private updateChanges = new Subject();
  private nameCache: {
    user: { [guid: string]: string },
    role: { [guid: string]: string } } = {
      user: {},
      role: {}
    };

  // Per-row apply status (busy → done/error), driven by the service's
  // executeChanges. Replaces the legacy entity-update monitor column.
  statusOf(row: CfRoleChangeWithNames): RoleChangeApplyState | undefined {
    return this.rolesData.applyStatus()[CfUsersRolesDataService.changeKey(row)];
  }

  rowKey(row: CfRoleChangeWithNames): string {
    return CfUsersRolesDataService.changeKey(row);
  }

  ngOnInit() {
    this.createCfObs();
    this.createChangesObs();
  }

  ngAfterContentInit() {
    this.orgName$ = this.changes$.pipe(
      filter((changes) => !!changes.length),
      map((changes) => {
        const orgNames = changes.map((c) => c.orgName);
        return Array.from(new Set(orgNames)).map((orgName) => `'${orgName}'`).join(', ');
      }),
      take(1)
    );
  }

  onEnter = () => {
    // Rebuild the change list for display when the step is entered.
    this.updateChanges.next(new Date().getTime());
  };

  fetchUsername = (userGuid: string, users: StUser[]): string => {
    let res = this.nameCache.user[userGuid];
    if (res) {
      return res;
    }
    // getUsers now yields the drained StUser[] (guid is the identity); fall
    // back to the guid when a user isn't in the set so the confirm row still
    // renders rather than throwing (the legacy .find(...).entity would crash).
    res = users.find(user => user.guid === userGuid)?.username || userGuid;
    this.nameCache.user[userGuid] = res;
    return res;
  };

  fetchRoleName = (roleName: OrgUserRoleNames | SpaceUserRoleNames, isOrg: boolean): string => {
    return isOrg
      ? UserRoleLabels.org.short[roleName as OrgUserRoleNames]
      : UserRoleLabels.space.short[roleName as SpaceUserRoleNames];
  };

  private createCfObs() {
    this.cfGuid$ = this.state$.pipe(
      map(mu => mu?.cfGuid),
      filter(cfGuid => !!cfGuid),
      distinctUntilChanged(),
    );
  }

  private createChangesObs() {
    const changesViaUsername = this.updateChanges.pipe(
      switchMap(() => this.changedRoles$),
      map(changes => changes
        .map(change => ({
          ...change,
          username: ManageUsersSetUsernamesHelper.usernameFromGuid(change.userGuid),
          roleName: this.fetchRoleName(change.role, !change.spaceGuid)
        }))
        .sort((a, b) => naturalCompare(a.username, b.username)),
      )
    );
    const changesViaUserGuid = this.updateChanges.pipe(
      withLatestFrom(this.cfGuid$),
      mergeMap(([, cfGuid]) => this.usersData.getUsers(cfGuid)),
      withLatestFrom(this.changedRoles$),
      map(([users, changes]) =>
        changes
          .map(change => ({
            ...change,
            username: this.fetchUsername(change.userGuid, users),
            roleName: this.fetchRoleName(change.role, !change.spaceGuid)
          }))
          .sort((a, b) => naturalCompare(a.username, b.username))
      )
    );
    this.changes$ = this.setUsernames ? changesViaUsername : changesViaUserGuid;
  }

}
