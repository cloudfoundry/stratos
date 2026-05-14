import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@stratosui/store';
import { Observable, Subject } from 'rxjs';
import { take, distinctUntilChanged, filter, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';

import {
  AppActionMonitorComponent,
  AppMonitorComponentTypes,
  ITableColumn,
  ITableCellRequestMonitorIconConfig } from '@stratosui/core';
import { entityCatalog, APIResource } from '@stratosui/store';
import { UsersRolesClearUpdateState } from '../../../../../actions/users-roles.actions';
import { ChangeCfUserRole } from '../../../../../actions/users.actions';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { cfUserEntityType, organizationEntityType, spaceEntityType } from '../../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { CfUsersRolesDataService } from '../../../../../services/domain-data/cf-users-roles-data.service';
import {
  TableCellConfirmOrgSpaceComponent } from '../../../../../shared/components/list/list-types/cf-confirm-roles/table-cell-confirm-org-space/table-cell-confirm-org-space.component';
import {
  TableCellConfirmRoleAddRemComponent } from '../../../../../shared/components/list/list-types/cf-confirm-roles/table-cell-confirm-role-add-rem/table-cell-confirm-role-add-rem.component';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { CfUser, OrgUserRoleNames, SpaceUserRoleNames } from '../../../../../store/types/cf-user.types';
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
    AppActionMonitorComponent
  ]
})
export class UsersRolesConfirmComponent implements OnInit, AfterContentInit {
  private store = inject(Store<CFAppState>);
  private cfUserService = inject(CfUserService);
  private rolesData = inject(CfUsersRolesDataService);
  // Cached toObservable bridges so handlers can use them outside the
  // injection context.
  private state$ = toObservable(this.rolesData.state);
  private changedRoles$ = toObservable(this.rolesData.changedRoles);

  @Input() setUsernames = false;

  columns: ITableColumn<CfRoleChangeWithNames>[] = [
    {
      headerCell: () => 'User',
      columnId: 'user',
      cellDefinition: {
        valuePath: 'username'
      },
      cellFlex: '1'
    },
    {
      headerCell: () => 'Action',
      columnId: 'action',
      cellComponent: TableCellConfirmRoleAddRemComponent,
      cellFlex: '1'
    },
    {
      headerCell: () => 'Role',
      columnId: 'role',
      cellDefinition: {
        valuePath: 'roleName'
      },
      cellFlex: '1'
    },
    {
      headerCell: () => 'Target',
      columnId: 'target',
      cellComponent: TableCellConfirmOrgSpaceComponent,
      cellFlex: '1'
    }
  ];
  changes$!: Observable<CfRoleChangeWithNames[]>;
  public userCatalogEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, cfUserEntityType);

  monitorState = AppMonitorComponentTypes.UPDATE;
  private cfGuid$: Observable<string>;
  public orgName$: Observable<string>;

  private updateChanges = new Subject();
  private nameCache: {
    user: { [guid: string]: string },
    role: { [guid: string]: string } } = {
      user: {},
      role: {}
    };

  public getCellConfig(row: CfRoleChangeWithNames): ITableCellRequestMonitorIconConfig {
    const isSpace = !!row.spaceGuid;
    const schema = isSpace ? cfEntityFactory(spaceEntityType) : cfEntityFactory(organizationEntityType);
    const guid = isSpace ? row.spaceGuid : row.orgGuid;
    return {
      entityKey: entityCatalog.getEntityKey(schema),
      schema,
      monitorState: AppMonitorComponentTypes.UPDATE,
      updateKey: ChangeCfUserRole.generateUpdatingKey(row.role, row.userGuid),
      getId: () => guid
    };
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
    // Kick off an update
    this.updateChanges.next(new Date().getTime());
    // Ensure that any entity we're going to show the state for is clear of any previous or unrelated errors
    this.state$.pipe(
      take(1),
    ).subscribe(usersRoles => {
      if (usersRoles) {
        this.store.dispatch(new UsersRolesClearUpdateState(usersRoles.changedRoles));
      }
    });
  };

  fetchUsername = (userGuid: string, users: APIResource<CfUser>[]): string => {
    let res = this.nameCache.user[userGuid];
    if (res) {
      return res;
    }
    res = users.find(user => user.metadata.guid === userGuid).entity.username;
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
        .sort((a, b) => a.username.localeCompare(b.username)),
      )
    );
    const changesViaUserGuid = this.updateChanges.pipe(
      withLatestFrom(this.cfGuid$),
      mergeMap(([, cfGuid]) => this.cfUserService.getUsers(cfGuid)),
      withLatestFrom(this.changedRoles$),
      map(([users, changes]) =>
        changes
          .map(change => ({
            ...change,
            username: this.fetchUsername(change.userGuid, users),
            roleName: this.fetchRoleName(change.role, !change.spaceGuid)
          }))
          .sort((a, b) => a.username.localeCompare(b.username))
      )
    );
    this.changes$ = this.setUsernames ? changesViaUsername : changesViaUserGuid;
  }

}
