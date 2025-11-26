import { Store } from '@ngrx/store';
import { combineLatest, type Observable, of as observableOf } from 'rxjs';
import { distinctUntilChanged, map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import type { GeneralEntityAppState } from '@stratosui/store';
import {
  type TableRowStateManager,
  type ITableColumn,
  type IGlobalListAction,
  type IListAction,
  type IListConfig,
  type IListMultiFilterConfig,
  type IMultiListAction,
  ListViewTypes,
  ListRowSateHelper,
  type ListRowStateSetUpManager,
} from '@stratosui/core';
import type { ListView } from '../../../../../../../store/src/actions/list.actions';
import type { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import type { PaginationMonitor } from '../../../../../../../store/src/monitors/pagination-monitor';
import type { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import type { APIResource } from '../../../../../../../store/src/types/api.types';
import type { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import type { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { waitForCFPermissions } from '../../../../../features/cf/cf.helpers';
import type { CfUser, CfUserMissingRoles } from '../../../../../store/types/cf-user.types';
import type { CfUserService } from '../../../../data-services/cf-user.service';
import { CfSelectUsersDataSourceService } from './cf-select-users-data-source.service';

export class CfSelectUsersListConfigService implements IListConfig<APIResource<CfUser>> {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource!: CfSelectUsersDataSourceService;
  defaultView = 'table' as ListView;
  enableTextFilter = true;
  text = {
    title: null as string | null,
    filter: 'Search by name',
    noEntries: 'There are no users'
  };
  columns: ITableColumn<APIResource<CfUser>>[] = [
    {
      columnId: 'username',
      headerCell: () => 'Username',
      cellFlex: '10',
      cellAlignSelf: 'baseline',
      cellDefinition: {
        getValue: row => this.getUsername(row.entity)
      },
      sort: {
        type: 'sort',
        orderKey: 'username',
        field: 'entity.username'
      }
    }
  ];
  private initialised: Observable<boolean>;

  constructor(
    private store: Store<GeneralEntityAppState>,
    private cfGuid: string,
    cfUserService: CfUserService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private entityMonitorFactory: EntityMonitorFactory
  ) {
    this.initialised = waitForCFPermissions(
      store,
      activeRouteCfOrgSpace.cfGuid
    ).pipe(
      switchMap(cf =>
        combineLatest(
          observableOf(cf),
          cfUserService.createPaginationAction(
            cf.global.isAdmin,
            activeRouteCfOrgSpace.cfGuid,
            activeRouteCfOrgSpace.orgGuid,
            activeRouteCfOrgSpace.spaceGuid)
        )
      ),
      tap(([_cf, action]) => this.createDataSource(action)),
      map(([cf]) => cf?.state.initialised),
      publishReplay(1),
      refCount()
    );
  }

  private cfUserRowStateSetUpManager: ListRowStateSetUpManager = (
    paginationMonitor: PaginationMonitor<APIResource<CfUser>>,
    _entityMonitorFactory: EntityMonitorFactory,
    rowStateManager: TableRowStateManager
  ) => {
    return paginationMonitor.currentPage$.pipe(
      distinctUntilChanged(),
      switchMap(entities => {
        entities.forEach(entity => {
          const hasMissingRoles = this.hasMissingRoles(entity.entity.missingRoles);
          rowStateManager.updateRowState(entity.metadata.guid, { warning: hasMissingRoles });
        });
        return entities;
      }),
    ).subscribe();
  }

  private createDataSource(action: PaginatedAction) {
    const rowStateHelper = new ListRowSateHelper();
    const { rowStateManager, sub } = rowStateHelper.getRowStateManager(
      this.paginationMonitorFactory,
      this.entityMonitorFactory,
      action.paginationKey,
      action,
      this.cfUserRowStateSetUpManager.bind(this),
      action.flattenPagination
    );
    this.dataSource = new CfSelectUsersDataSourceService(this.cfGuid, this.store, action, this, rowStateManager, () => {
      sub.unsubscribe();
    });
  }

  private getUsername = (user: CfUser): string => {
    const username = user.username || user.guid;
    return this.hasMissingRoles(user.missingRoles) ? `${username} - Not all roles for this user are known` : username;
  }

  private hasMissingRoles(missingRoles: CfUserMissingRoles): boolean {
    if (missingRoles) {
      if (this.activeRouteCfOrgSpace.spaceGuid) {
        // At space level, we'll have all the org and space roles (impossible to have missing roles)
        return false;
      } else if (this.activeRouteCfOrgSpace.orgGuid) {
        // At org level, we'll have all the org but possibly not space roles
        return !!missingRoles.space.length;
      } else {
        // At cf level, we might not have either org or space roles
        return !!missingRoles.org.length || !!missingRoles.space.length;
      }
    }
  }

  getColumns = (): ITableColumn<APIResource<CfUser>>[] => this.columns;
  getGlobalActions = (): IGlobalListAction<APIResource<CfUser>>[] => [];
  getMultiActions = (): IMultiListAction<APIResource<CfUser>>[] => [];
  getSingleActions = (): IListAction<APIResource<CfUser>>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getDataSource = () => this.dataSource as any;
  getInitialised = (): Observable<boolean> => this.initialised;
}
