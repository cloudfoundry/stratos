import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { waitForCFPermissions } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, IMultiListAction, ListViewTypes } from '../../list.component.types';
import { ListRowSateHelper } from '../../list.helper';
import { cfUserRowStateSetUpManager } from '../cf-users/cf-user-list-helper';
import { CfSelectUsersDataSourceService } from './cf-select-users-data-source.service';

@Injectable()
export class CfSelectUsersListConfigService
  implements IListConfig<APIResource<CfUser>> {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: CfSelectUsersDataSourceService;
  defaultView = 'table' as ListView;
  enableTextFilter = true;
  text = {
    title: null,
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
        getValue: row => row.entity.username || row.metadata.guid
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
    private store: Store<AppState>,
    private cfGuid: string,
    private cfUserService: CfUserService,
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
          cfUserService.createPaginationAction(cf.global.isAdmin, true)
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
        this.dataSource = new CfSelectUsersDataSourceService(cfGuid, this.store, action, this, rowStateManager, () => {
          sub.unsubscribe();
        });
      }),
      map(([cf]) => cf && cf.state.initialised),
      publishReplay(1),
      refCount()
    );
  }

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = (): IMultiListAction<APIResource<CfUser>>[] => [
    {
      label: 'delete me',
      description: '',
      action: (items: APIResource<CfUser>[]) => false
    }
  ]
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
  getInitialised = () => this.initialised;
}
