
import { combineLatest as observableCombineLatest, BehaviorSubject, Observable } from 'rxjs';
import { AfterContentInit, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, first, map, mergeMap, withLatestFrom } from 'rxjs/operators';

import { IOrganization } from '../../../../../core/cf-api.types';
import {
  AppMonitorComponentTypes,
} from '../../../../../shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import {
  ITableCellRequestMonitorIconConfig,
} from '../../../../../shared/components/list/list-table/table-cell-request-monitor-icon/table-cell-request-monitor-icon.component';
import { ITableColumn } from '../../../../../shared/components/list/list-table/table.types';
import {
  TableCellConfirmOrgSpaceComponent,
  // tslint:disable-next-line:max-line-length
} from '../../../../../shared/components/list/list-types/cf-confirm-roles/table-cell-confirm-org-space/table-cell-confirm-org-space.component';
import {
  TableCellConfirmRoleAddRemComponent,
  // tslint:disable-next-line:max-line-length
} from '../../../../../shared/components/list/list-types/cf-confirm-roles/table-cell-confirm-role-add-rem/table-cell-confirm-role-add-rem.component';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { UsersRolesClearUpdateState } from '../../../../../store/actions/users-roles.actions';
import { ChangeUserRole } from '../../../../../store/actions/users.actions';
import { AppState } from '../../../../../store/app-state';
import {
  cfUserSchemaKey,
  entityFactory,
  organizationSchemaKey,
  spaceSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import { selectUsersRoles, selectUsersRolesChangedRoles } from '../../../../../store/selectors/users-roles.selector';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser, OrgUserRoleNames, SpaceUserRoleNames } from '../../../../../store/types/user.types';
import { CfRoleChangeWithNames, UserRoleLabels } from '../../../../../store/types/users-roles.types';
import { CfRolesService } from '../cf-roles.service';

@Component({
  selector: 'app-manage-users-confirm',
  templateUrl: './manage-users-confirm.component.html',
  styleUrls: ['./manage-users-confirm.component.scss']
})
export class UsersRolesConfirmComponent implements OnInit, AfterContentInit {

  columns: ITableColumn<CfRoleChangeWithNames>[] = [
    {
      headerCell: () => 'User',
      columnId: 'user',
      cellDefinition: {
        valuePath: 'userName'
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
  changes$: Observable<CfRoleChangeWithNames[]>;
  userSchemaKey = cfUserSchemaKey;
  monitorState = AppMonitorComponentTypes.UPDATE;
  private cfAndOrgGuid$: Observable<{ cfGuid: string, orgGuid: string }>;
  public orgName$ = new BehaviorSubject('');

  private updateChanges = new BehaviorSubject(0);
  private nameCache: {
    user: { [guid: string]: string },
    space: { [guid: string]: string },
    org: { [guid: string]: string },
    role: { [guid: string]: string },
  } = {
      user: {},
      space: {},
      org: {},
      role: {}
    };

  public getCellConfig(row: CfRoleChangeWithNames): ITableCellRequestMonitorIconConfig {
    const isSpace = !!row.spaceGuid;
    const schema = isSpace ? entityFactory(spaceSchemaKey) : entityFactory(organizationSchemaKey);
    const guid = isSpace ? row.spaceGuid : row.orgGuid;
    return {
      entityKey: schema.key,
      schema: schema,
      monitorState: AppMonitorComponentTypes.UPDATE,
      updateKey: ChangeUserRole.generateUpdatingKey(row.role, row.userGuid),
      getId: () => guid
    };
  }

  constructor(private store: Store<AppState>, private cfRolesService: CfRolesService, private cfUserService: CfUserService) { }

  ngOnInit() {
    this.createCfAndOrgObs();

    this.createChangesObs();
  }

  ngAfterContentInit() {
    this.cfAndOrgGuid$.pipe(
      mergeMap(({ cfGuid, orgGuid }) => this.cfRolesService.fetchOrgEntity(cfGuid, orgGuid)),
    ).subscribe(org => this.orgName$.next(org.entity.name));
  }

  onEnter = () => {
    // Kick off an update
    this.updateChanges.next(new Date().getTime());
    // Ensure that any entity we're going to show the state for is clear of any previous or unrelated errors
    this.store.select(selectUsersRoles).pipe(
      first(),
    ).subscribe(usersRoles => this.store.dispatch(new UsersRolesClearUpdateState(usersRoles.changedRoles)));
  }

  fetchUserName = (userGuid: string, users: APIResource<CfUser>[]): string => {
    let res = this.nameCache.user[userGuid];
    if (res) {
      return res;
    }
    res = users.find(user => user.entity.guid === userGuid).entity.username;
    this.nameCache.user[userGuid] = res;
    return res;
  }

  fetchOrgName = (orgGuid: string, org: APIResource<IOrganization>): string => {
    if (!orgGuid) {
      return '';
    }
    let res = this.nameCache.org[orgGuid];
    if (res) {
      return res;
    }
    res = org.entity.name;
    this.nameCache.org[orgGuid] = res;
    return res;
  }

  fetchSpaceName = (spaceGuid: string, org: APIResource<IOrganization>): string => {
    if (!spaceGuid) {
      return '';
    }
    let res = this.nameCache.space[spaceGuid];
    if (res) {
      return res;
    }
    res = org.entity.spaces.find(space => space.entity.guid === spaceGuid).entity.name;
    this.nameCache.space[spaceGuid] = res;
    return res;
  }

  fetchRoleName = (roleName: OrgUserRoleNames | SpaceUserRoleNames, isOrg: boolean): string => {
    return isOrg ? UserRoleLabels.org.short[roleName] : UserRoleLabels.space.short[roleName];
  }

  private createCfAndOrgObs() {
    this.cfAndOrgGuid$ = this.store.select(selectUsersRoles).pipe(
      map(mu => ({ cfGuid: mu.cfGuid, orgGuid: mu.newRoles.orgGuid })),
      filter(mu => !!mu.cfGuid && !!mu.orgGuid),
      distinctUntilChanged((oldMU, newMU) => {
        return oldMU.cfGuid === newMU.cfGuid && oldMU.orgGuid === newMU.orgGuid;
      }),
    );
  }

  private createChangesObs() {
    this.changes$ = this.updateChanges.pipe(
      withLatestFrom(this.cfAndOrgGuid$),
      mergeMap(([changed, { cfGuid, orgGuid }]) => {
        return observableCombineLatest(
          this.cfUserService.getUsers(cfGuid),
          this.cfRolesService.fetchOrgEntity(cfGuid, orgGuid)
        );
      }),
      withLatestFrom(
        this.store.select(selectUsersRolesChangedRoles),
      ),
      map(([[users, org], changes]) => {
        return changes
          .map(change => ({
            ...change,
            userName: this.fetchUserName(change.userGuid, users),
            spaceName: this.fetchSpaceName(change.spaceGuid, org),
            orgName: this.fetchOrgName(change.orgGuid, org),
            roleName: this.fetchRoleName(change.role, !change.spaceGuid)
          }))
          .sort((a, b) => {
            return a.userName.localeCompare(b.userName);
          });
      }),
    );
  }

}
