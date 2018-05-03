import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { CfSelectUsersDataSourceService } from './cf-select-users-data-source.service';

@Injectable()
export class CfSelectUsersListConfigService implements IListConfig<APIResource<CfUser>> {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: CfSelectUsersDataSourceService;
  defaultView = 'table' as ListView;
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no users'
  };
  columns: ITableColumn<APIResource<CfUser>>[] = [{
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
  }];

  constructor(private store: Store<AppState>, private cfGuid: string) {
    this.dataSource = new CfSelectUsersDataSourceService(cfGuid, this.store, this);
  }

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = () => [{
    label: 'delete me',
    description: '',
    action: (items: APIResource<CfUser>[]) => false,
    visible: () => true,
    enabled: () => true,
  }]
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
