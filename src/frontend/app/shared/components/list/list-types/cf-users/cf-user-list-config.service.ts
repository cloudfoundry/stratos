import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../../../../core/cf-api.types';
import { CurrentUserPermissionsChecker } from '../../../../../core/current-user-permissions.checker';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { canUpdateOrgSpaceRoles, waitForCFPermissions } from '../../../../../features/cloud-foundry/cf.helpers';
import { UsersRolesSetUsers } from '../../../../../store/actions/users-roles.actions';
import { CfUser } from '../../../../../store/types/user.types';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { ListRowSateHelper } from '../../list.helper';
import { AppState } from './../../../../../store/app-state';
import { APIResource, EntityInfo } from './../../../../../store/types/api.types';
import { CfUserService } from './../../../../data-services/cf-user.service';
import { ITableColumn } from './../../list-table/table.types';
import { IListAction, IMultiListAction, ListConfig, ListViewTypes } from './../../list.component.types';
import { CfOrgPermissionCellComponent } from './cf-org-permission-cell/cf-org-permission-cell.component';
import { CfSpacePermissionCellComponent } from './cf-space-permission-cell/cf-space-permission-cell.component';
import { CfUserDataSourceService } from './cf-user-data-source.service';
import { cfUserHasAllRoleProperties, cfUserRowStateSetUpManager } from './cf-user-list-helper';


@Injectable()
export class CfUserListConfigService extends ListConfig<APIResource<CfUser>> {
  isLocal = true;
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: CfUserDataSourceService;
  tableRowAlignSelf = 'end';
  columns: ITableColumn<APIResource<CfUser>>[] = [
    {
      columnId: 'username',
      headerCell: () => 'Username',
      cellFlex: '1',
      cellDefinition: {
        getValue: row => row.entity.username || row.metadata.guid
      },
      sort: {
        type: 'sort',
        orderKey: 'username',
        field: 'entity.username'
      }
    },
    {
      columnId: 'username2',
      headerCell: () => 'missing',
      cellFlex: '1',
      cellDefinition: {
        getValue: row => JSON.stringify((row.entity.missingRoles || []))
      },
    },
    {
      columnId: 'roles',
      headerCell: () => 'Organization Roles',
      cellFlex: '3',
      cellComponent: CfOrgPermissionCellComponent
    },
    {
      columnId: 'space-roles',
      headerCell: () => 'Space Roles',
      cellFlex: '3',
      cellComponent: CfSpacePermissionCellComponent
    },
  ];
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by username',
    noEntries: 'There are no users'
  };
  private initialised: Observable<boolean>;
  private canEditOrgSpaceRoles$: Observable<boolean>;

  manageUserAction: IListAction<APIResource<CfUser>> = {
    action: (user: APIResource<CfUser>) => {
      this.store.dispatch(new UsersRolesSetUsers(this.cfUserService.activeRouteCfOrgSpace.cfGuid, [user.entity]));
      this.router.navigate([this.createManagerUsersUrl()], { queryParams: { user: user.entity.guid } });
    },
    label: 'Manage',
    description: `Change Roles`,
    createVisible: (row$: Observable<APIResource<CfUser>>) => {
      return combineLatest(this.createCanUpdateOrgSpaceRoles(), row$).pipe(
        map(([canUpdate, row]) => canUpdate && cfUserHasAllRoleProperties(row))
      );
    }
  };

  manageMultiUserAction: IMultiListAction<APIResource<CfUser>> = {
    action: (users: APIResource<CfUser>[]) => {
      this.store.dispatch(new UsersRolesSetUsers(this.cfUserService.activeRouteCfOrgSpace.cfGuid, users.map(user => user.entity)));
      if (users.length === 1) {
        this.router.navigate([this.createManagerUsersUrl()], { queryParams: { user: users[0].entity.guid } });
      } else {
        this.router.navigate([this.createManagerUsersUrl()]);
      }
      return false;
    },
    icon: 'people',
    label: 'Manage',
    description: `Change Roles`,
  };

  private createManagerUsersUrl(user: APIResource<CfUser> = null): string {
    let route = `/cloud-foundry/${this.cfUserService.activeRouteCfOrgSpace.cfGuid}`;
    if (this.activeRouteCfOrgSpace.orgGuid) {
      route += `/organizations/${this.activeRouteCfOrgSpace.orgGuid}`;
      if (this.activeRouteCfOrgSpace.spaceGuid) {
        route += `/spaces/${this.activeRouteCfOrgSpace.spaceGuid}`;
      }
    }
    route += `/users/manage`;
    return route;
  }

  constructor(
    private store: Store<AppState>,
    private cfUserService: CfUserService,
    private router: Router,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private userPerms: CurrentUserPermissionsService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private entityMonitorFactory: EntityMonitorFactory,
    org$?: Observable<EntityInfo<APIResource<IOrganization>>>,
    space$?: Observable<EntityInfo<APIResource<ISpace>>>,
  ) {
    super();

    this.assignColumnConfig(org$, space$);

    this.initialised = waitForCFPermissions(store, activeRouteCfOrgSpace.cfGuid).pipe(
      switchMap(cf =>
        combineLatest(
          observableOf(cf),
          (space$ || observableOf(null)).pipe(switchMap(space => cfUserService.createPaginationAction(cf.global.isAdmin, !!space)))
        )
      ),
      tap(([cf, action]) => {
        const rowStateHelper = new ListRowSateHelper();
        const { rowStateManager, sub } = rowStateHelper.getRowStateManager(
          paginationMonitorFactory,
          entityMonitorFactory,
          action.paginationKey,
          action.entityKey,
          cfUserRowStateSetUpManager
        );
        this.dataSource = new CfUserDataSourceService(store, action, this, rowStateManager, () => {
          sub.unsubscribe();
        });
      }),
      map(([cf, action]) => cf && cf.state.initialised)
    );
    this.manageMultiUserAction.visible$ = this.createCanUpdateOrgSpaceRoles();
  }

  /**
   * Assign the org and/or spaces obs to the cell configs. These will be used to determine which org or space roles to show
   *
   * @private
   * @memberof CfUserListConfigService
   */
  private assignColumnConfig = (
    org$?: Observable<EntityInfo<APIResource<IOrganization>>>,
    space$?: Observable<EntityInfo<APIResource<ISpace>>>) => {

    const { safeOrg$, safeSpaces$ } = this.getSafeObservables(org$, space$);

    this.columns.find(column => column.columnId === 'roles').cellConfig = {
      org$: safeOrg$
    };
    this.columns.find(column => column.columnId === 'space-roles').cellConfig = {
      org$: safeOrg$,
      spaces$: safeSpaces$
    };
  }

  private getSafeObservables(
    org$?: Observable<EntityInfo<APIResource<IOrganization>>>,
    space$?: Observable<EntityInfo<APIResource<ISpace>>>
  ) {
    if (space$ && org$) {
      // List should show specific org and specific space roles
      return {
        safeOrg$: org$.pipe(map(org => org ? org.entity : null)),
        safeSpaces$: space$.pipe(
          map(space => [space.entity])
        )
      };
    } else if (org$) {
      // List should show specific org and space roles from with org
      const safeOrg$ = org$.pipe(map(org => org ? org.entity : null));
      return {
        safeOrg$,
        safeSpaces$: safeOrg$.pipe(
          map((org: APIResource<IOrganization>) => org.entity.spaces),
          // Important for when we fetch spaces async. This prevents the null passing through, which would mean all spaces are shown aka use
          // case below
          filter(spaces => !!spaces)
        )
      };
    } else {
      // List should show all org and all space roles
      return {
        safeOrg$: observableOf(null),
        safeSpaces$: observableOf(null)
      };
    }
  }

  private createCanUpdateOrgSpaceRoles = () => canUpdateOrgSpaceRoles(
    this.userPerms,
    this.activeRouteCfOrgSpace.cfGuid,
    this.activeRouteCfOrgSpace.orgGuid,
    this.activeRouteCfOrgSpace.orgGuid && !this.activeRouteCfOrgSpace.spaceGuid ?
      CurrentUserPermissionsChecker.ALL_SPACES : this.activeRouteCfOrgSpace.spaceGuid)

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = () => [this.manageMultiUserAction];
  getSingleActions = () => [this.manageUserAction];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
  getInitialised = () => this.initialised;

}
