/* tslint:disable:max-line-length */
import { AfterContentInit, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, first, map, mergeMap, withLatestFrom } from 'rxjs/operators';

import { entityCatalogue } from '../../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import {
  AppMonitorComponentTypes,
} from '../../../../../../../core/src/shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import {
  ITableCellRequestMonitorIconConfig,
} from '../../../../../../../core/src/shared/components/list/list-table/table-cell-request-monitor-icon/table-cell-request-monitor-icon.component';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  selectUsersRoles,
  selectUsersRolesChangedRoles,
} from '../../../../../../../store/src/selectors/users-roles.selector';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { UsersRolesClearUpdateState } from '../../../../../actions/users-roles.actions';
import { ChangeUserRole } from '../../../../../actions/users.actions';
import { CFAppState } from '../../../../../cf-app-state';
import {
  cfEntityFactory,
  cfUserEntityType,
  organizationEntityType,
  spaceEntityType,
} from '../../../../../cf-entity-factory';
import {
  TableCellConfirmOrgSpaceComponent,
} from '../../../../../shared/components/list/list-types/cf-confirm-roles/table-cell-confirm-org-space/table-cell-confirm-org-space.component';
import {
  TableCellConfirmRoleAddRemComponent,
} from '../../../../../shared/components/list/list-types/cf-confirm-roles/table-cell-confirm-role-add-rem/table-cell-confirm-role-add-rem.component';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { CfUser, OrgUserRoleNames, SpaceUserRoleNames } from '../../../../../store/types/user.types';
import { CfRoleChangeWithNames, UserRoleLabels } from '../../../../../store/types/users-roles.types';

/* tslint:enable:max-line-length */

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
  public userCatalogueEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, cfUserEntityType);

  monitorState = AppMonitorComponentTypes.UPDATE;
  private cfGuid$: Observable<string>;
  public orgName$: Observable<string>;

  private updateChanges = new Subject();
  private nameCache: {
    user: { [guid: string]: string },
    role: { [guid: string]: string },
  } = {
      user: {},
      role: {}
    };

  public getCellConfig(row: CfRoleChangeWithNames): ITableCellRequestMonitorIconConfig {
    const isSpace = !!row.spaceGuid;
    const schema = isSpace ? cfEntityFactory(spaceEntityType) : cfEntityFactory(organizationEntityType);
    const guid = isSpace ? row.spaceGuid : row.orgGuid;
    return {
      entityKey: schema.key,
      schema,
      monitorState: AppMonitorComponentTypes.UPDATE,
      updateKey: ChangeUserRole.generateUpdatingKey(row.role, row.userGuid),
      getId: () => guid
    };
  }

  constructor(private store: Store<CFAppState>, private cfUserService: CfUserService) { }

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
      first()
    );
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

  fetchRoleName = (roleName: OrgUserRoleNames | SpaceUserRoleNames, isOrg: boolean): string => {
    return isOrg ? UserRoleLabels.org.short[roleName] : UserRoleLabels.space.short[roleName];
  }

  private createCfObs() {
    this.cfGuid$ = this.store.select(selectUsersRoles).pipe(
      map(mu => mu.cfGuid),
      filter(cfGuid => !!cfGuid),
      distinctUntilChanged(),
    );
  }

  private createChangesObs() {
    this.changes$ = this.updateChanges.pipe(
      withLatestFrom(this.cfGuid$),
      mergeMap(([changed, cfGuid]) => this.cfUserService.getUsers(cfGuid)),
      withLatestFrom(this.store.select(selectUsersRolesChangedRoles)),
      map(([users, changes]) => {
        return changes
          .map(change => {
            return {
              ...change,
              userName: this.fetchUserName(change.userGuid, users),
              roleName: this.fetchRoleName(change.role, !change.spaceGuid)
            };
          })
          .sort((a, b) => {
            return a.userName.localeCompare(b.userName);
          });
      }),
    );
  }

}
