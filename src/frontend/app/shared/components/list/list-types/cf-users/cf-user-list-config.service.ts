import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, switchMap, tap } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../../../../core/cf-api.types';
import { CurrentUserPermissionsChecker } from '../../../../../core/current-user-permissions.checker';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { canUpdateOrgSpaceRoles, waitForCFPermissions } from '../../../../../features/cloud-foundry/cf.helpers';
import { SetClientFilter } from '../../../../../store/actions/pagination.actions';
import { UsersRolesSetUsers } from '../../../../../store/actions/users-roles.actions';
import { selectPaginationState } from '../../../../../store/selectors/pagination.selectors';
import { PaginatedAction } from '../../../../../store/types/pagination.types';
import { CfUser } from '../../../../../store/types/user.types';
import { AppState } from './../../../../../store/app-state';
import { APIResource, EntityInfo } from './../../../../../store/types/api.types';
import { CfUserService } from './../../../../data-services/cf-user.service';
import { ITableColumn } from './../../list-table/table.types';
import {
  IListAction,
  IListMultiFilterConfig,
  IMultiListAction,
  ListConfig,
  ListViewTypes,
} from './../../list.component.types';
import { CfOrgPermissionCellComponent } from './cf-org-permission-cell/cf-org-permission-cell.component';
import { CfSpacePermissionCellComponent } from './cf-space-permission-cell/cf-space-permission-cell.component';
import { CfUserDataSourceService } from './cf-user-data-source.service';
import { userHasRole, UserListUsersVisible, userListUserVisibleKey } from './cf-user-list-helpers';

const defaultUserHasRoles: (user: CfUser) => boolean = (user: CfUser): boolean => {
  return userHasRole(user, 'organizations') ||
    userHasRole(user, 'spaces') ||
    userHasRole(user, 'managed_organizations') ||
    userHasRole(user, 'managed_spaces') ||
    userHasRole(user, 'audited_organizations') ||
    userHasRole(user, 'audited_spaces') ||
    userHasRole(user, 'billing_managed_organizations');
};

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
  private multiFilterConfigs: IListMultiFilterConfig[];

  manageUserAction: IListAction<APIResource<CfUser>> = {
    action: (user: APIResource<CfUser>) => {
      this.store.dispatch(new UsersRolesSetUsers(this.cfUserService.activeRouteCfOrgSpace.cfGuid, [user.entity]));
      this.router.navigate([this.createManagerUsersUrl()], { queryParams: { user: user.entity.guid } });
    },
    label: 'Manage',
    description: `Change Roles`,
    createVisible: (row$: Observable<APIResource>) => this.createCanUpdateOrgSpaceRoles()
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

  private createManagerUsersUrl(): string {
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
    userHasRoles: (user: CfUser) => boolean = defaultUserHasRoles,
    org$?: Observable<EntityInfo<APIResource<IOrganization>>>,
    space$?: Observable<EntityInfo<APIResource<ISpace>>>,
  ) {
    super();

    this.assignColumnConfig(org$, space$);

    this.assignMultiConfig();

    this.initialised = waitForCFPermissions(store, activeRouteCfOrgSpace.cfGuid).pipe(
      switchMap(cf => // `cf` needed to create the second observable
        combineLatest(
          observableOf(cf),
          (space$ || observableOf(null)).pipe(switchMap(space => cfUserService.createPaginationAction(cf.global.isAdmin, !!space)))
        )
      ),
      tap(([cf, action]) => {
        this.dataSource = new CfUserDataSourceService(store, action, this, userHasRoles);

        this.initialiseMultiFilter(action);
      }),
      map(([cf, action]) => cf && cf.state.initialised)
    );
    this.manageMultiUserAction.visible$ = this.createCanUpdateOrgSpaceRoles();
  }

  private initialiseMultiFilter(action: PaginatedAction) {
    this.store.select(selectPaginationState(action.entityKey, action.paginationKey)).pipe(
      filter((pag) => !!pag),
      first(),
    ).subscribe(pag => {
      const currentFilter = pag.clientPagination.filter.items[userListUserVisibleKey];
      if (!currentFilter) {
        this.store.dispatch(new SetClientFilter(action.entityKey, action.paginationKey, {
          string: '',
          items: {
            [userListUserVisibleKey]: UserListUsersVisible.WITH_ROLE
          }
        }));
      }
    });
  }

  private assignMultiConfig = () => {
    this.multiFilterConfigs = [
      {
        key: userListUserVisibleKey,
        label: 'All Users',
        allLabel: 'All Users',
        list$: observableOf([
          {
            label: 'Users With Roles',
            item: UserListUsersVisible.WITH_ROLE,
            value: UserListUsersVisible.WITH_ROLE
          },
          {
            label: 'Users Without Roles',
            item: UserListUsersVisible.NO_ROLE,
            value: UserListUsersVisible.NO_ROLE
          }
        ]),
        loading$: observableOf(false),
        select: new BehaviorSubject(UserListUsersVisible.WITH_ROLE)
      }
    ];
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
  getMultiFiltersConfigs = () => this.multiFilterConfigs;
  getDataSource = () => this.dataSource;
  getInitialised = () => this.initialised;

}
