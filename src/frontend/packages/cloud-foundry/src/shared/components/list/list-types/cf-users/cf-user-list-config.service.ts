import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, switchMap, tap } from 'rxjs/operators';

import { UsersRolesSetUsers } from '../../../../../../../cloud-foundry/src/actions/users-roles.actions';
import { GetAllCfUsersAsAdmin } from '../../../../../../../cloud-foundry/src/actions/users.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ITableColumn, ITableText } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  IListAction,
  IListMultiFilterConfig,
  IMultiListAction,
  ListConfig,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { SetClientFilter } from '../../../../../../../store/src/actions/pagination.actions';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog';
import { selectPaginationState } from '../../../../../../../store/src/selectors/pagination.selectors';
import { APIResource, EntityInfo } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { IOrganization, ISpace } from '../../../../../cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import {
  canUpdateOrgSpaceRoles,
  createCfOrgSpaceSteppersUrl,
  createCfOrgSpaceUserRemovalUrl,
  hasRoleWithin,
  hasRoleWithinSpace,
  hasSpaceRoleWithinOrg,
  waitForCFPermissions,
} from '../../../../../features/cloud-foundry/cf.helpers';
import { CfUser } from '../../../../../store/types/cf-user.types';
import { CfUserPermissionsChecker } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CfUserService } from './../../../../data-services/cf-user.service';
import { CfOrgPermissionCellComponent } from './cf-org-permission-cell/cf-org-permission-cell.component';
import { CfSpacePermissionCellComponent } from './cf-space-permission-cell/cf-space-permission-cell.component';
import { CfUserDataSourceService } from './cf-user-data-source.service';
import { userHasRole, UserListUsersVisible, userListUserVisibleKey } from './cf-user-list-helpers';

const defaultUserHasSpaceRoles: (user: CfUser) => boolean = (user: CfUser): boolean => {
  return userHasRole(user, 'spaces') ||
    userHasRole(user, 'managed_spaces') ||
    userHasRole(user, 'audited_spaces');
};

const defaultUserHasOrgRoles: (user: CfUser) => boolean = (user: CfUser): boolean => {
  return userHasRole(user, 'organizations') ||
    userHasRole(user, 'managed_organizations') ||
    userHasRole(user, 'audited_organizations') ||
    userHasRole(user, 'billing_managed_organizations');
};

const defaultUserHasRoles: (user: CfUser) => boolean = (user: CfUser): boolean => {
  return defaultUserHasOrgRoles(user) || defaultUserHasSpaceRoles(user);
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
  text: ITableText = {
    title: null,
    filter: 'Search by username',
    noEntries: 'There are no users',
    maxedResults: {
      icon: 'people',
      canIgnoreMaxFirstLine: 'Fetching all users might take a long time',
      cannotIgnoreMaxFirstLine: 'There are too many users to fetch',
      filterLine: 'Please navigate to an Organization or Space users list'
    }
  };
  private initialised: Observable<boolean>;
  private multiFilterConfigs: IListMultiFilterConfig[];

  manageUserAction: IListAction<APIResource<CfUser>> = {
    action: (user: APIResource<CfUser>) => {
      this.store.dispatch(new UsersRolesSetUsers(this.cfUserService.activeRouteCfOrgSpace.cfGuid, [user.entity]));
      this.router.navigate([this.createManagerUsersUrl()], { queryParams: { user: user.metadata.guid } });
    },
    label: 'Manage Roles',
    createVisible: (row$: Observable<APIResource>) => this.createCanUpdateOrgSpaceRoles()
  };

  manageMultiUserAction: IMultiListAction<APIResource<CfUser>> = {
    action: (users: APIResource<CfUser>[]) => {
      this.store.dispatch(new UsersRolesSetUsers(this.cfUserService.activeRouteCfOrgSpace.cfGuid, users.map(user => user.entity)));
      if (users.length === 1) {
        this.router.navigate([this.createManagerUsersUrl()], { queryParams: { user: users[0].metadata.guid } });
      } else {
        this.router.navigate([this.createManagerUsersUrl()]);
      }
      return false;
    },
    icon: 'people',
    label: 'Manage',
    description: `Manage roles`,
  };

  removeUserActions(): IListAction<APIResource<CfUser>>[] {
    const activeRouteCfOrgSpace = this.cfUserService.activeRouteCfOrgSpace;
    const orgGuid = activeRouteCfOrgSpace.orgGuid;
    const spaceGuid = activeRouteCfOrgSpace.spaceGuid;
    const isCfContext = !orgGuid && !spaceGuid;

    const action = (withSpaces?: boolean) => {
      return (user: APIResource<CfUser>) => {
        const queryParams = { queryParams: { user: user.metadata.guid, spaces: withSpaces } };

        this.store.dispatch(new UsersRolesSetUsers(activeRouteCfOrgSpace.cfGuid, [user.entity]));
        this.router.navigate([this.createRemoveUserUrl()], queryParams);
      };
    };

    const fromSpaces: IListAction<APIResource<CfUser>> = {
      action: action(true),
      label: (() => (spaceGuid) ? 'Remove from space' : 'Remove from spaces')(),
      createVisible: (userRow$: Observable<APIResource<CfUser>>) => combineLatest(
        userRow$,
        this.createCanUpdateOrgSpaceRoles()
      ).pipe(
        map(([user, canUpdateRoles]) => {
          if (spaceGuid) {
            return canUpdateRoles && hasRoleWithinSpace(user.entity, spaceGuid);
          }

          if (orgGuid) {
            return canUpdateRoles && hasSpaceRoleWithinOrg(user.entity, orgGuid);
          }

          if (isCfContext) {
            return canUpdateRoles && defaultUserHasSpaceRoles(user.entity);
          }
        })
      )
    };

    const fromOrgsSpaces: IListAction<APIResource<CfUser>> = {
      action: action(),
      label: (() => (orgGuid) ? 'Remove from org and spaces' : 'Remove from orgs and spaces')(),
      createVisible: (userRow$: Observable<APIResource<CfUser>>) => combineLatest(
        userRow$,
        this.createCanUpdateOrgRoles()
      ).pipe(
        map(([user, canUpdateRoles]) => {
          if (orgGuid) {
            return canUpdateRoles && hasRoleWithin(user.entity, orgGuid, spaceGuid);
          } else {
            return canUpdateRoles && defaultUserHasOrgRoles(user.entity);
          }
        })
      )
    };

    if (spaceGuid) {
      return [fromSpaces];
    }

    return [fromOrgsSpaces, fromSpaces];
  }

  protected createManagerUsersUrl(): string {
    return createCfOrgSpaceSteppersUrl(
      this.cfUserService.activeRouteCfOrgSpace.cfGuid,
      `/users/manage`,
      this.activeRouteCfOrgSpace.orgGuid,
      this.activeRouteCfOrgSpace.spaceGuid
    );
  }

  protected createRemoveUserUrl(): string {
    return createCfOrgSpaceUserRemovalUrl(
      this.cfUserService.activeRouteCfOrgSpace.cfGuid,
      this.activeRouteCfOrgSpace.orgGuid,
      this.activeRouteCfOrgSpace.spaceGuid
    );
  }

  constructor(
    private store: Store<CFAppState>,
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

    this.initialised = waitForCFPermissions(store, activeRouteCfOrgSpace.cfGuid).pipe(
      switchMap(cf =>
        combineLatest(
          observableOf(cf),
          cfUserService.createPaginationAction(
            cf.global.isAdmin,
            activeRouteCfOrgSpace.cfGuid,
            activeRouteCfOrgSpace.orgGuid,
            activeRouteCfOrgSpace.spaceGuid),
        )
      ),
      tap(([cf, action]) => {
        this.dataSource = new CfUserDataSourceService(store, action, this, userHasRoles);

        // Only show the filter (show users with/without roles) if the list of users can actually contain users without roles
        if (GetAllCfUsersAsAdmin.is(action)) {
          this.assignMultiConfig();
          this.initialiseMultiFilter(action);
        } else {
          this.multiFilterConfigs = [];
        }

      }),
      map(([cf, action]) => cf && cf.state.initialised)
    );
    this.manageMultiUserAction.visible$ = this.createCanUpdateOrgSpaceRoles();
  }

  private initialiseMultiFilter(action: PaginatedAction) {
    const entityKey = entityCatalog.getEntityKey(action);
    this.store.select(selectPaginationState(entityKey, action.paginationKey)).pipe(
      filter((pag) => !!pag),
      first(),
    ).subscribe(pag => {
      const currentFilter = pag.clientPagination.filter.items[userListUserVisibleKey];
      if (!currentFilter) {
        this.store.dispatch(new SetClientFilter(action, action.paginationKey, {
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
      isOrgLevel: !space$,
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
      CfUserPermissionsChecker.ALL_SPACES : this.activeRouteCfOrgSpace.spaceGuid)

  private createCanUpdateOrgRoles = () => canUpdateOrgSpaceRoles(
    this.userPerms,
    this.activeRouteCfOrgSpace.cfGuid,
    this.activeRouteCfOrgSpace.orgGuid)

  getColumns = () => this.columns;
  getMultiActions = () => [this.manageMultiUserAction];
  getSingleActions = () => [this.manageUserAction, ...this.removeUserActions()];
  getMultiFiltersConfigs = () => this.multiFilterConfigs;
  getDataSource = () => this.dataSource;
  getInitialised = () => this.initialised;

}
