import { APIResource } from './../../../../../store/types/api.types';
import { ITableColumn } from './../../list-table/table.types';
import { CfUserService } from './../../../../data-services/cf-user.service';
import { AppState } from './../../../../../store/app-state';
import { Store } from '@ngrx/store';
import { CfUserDataSourceService } from './cf-user-data-source.service';
import { ListViewTypes, ListConfig } from './../../list.component.types';
import { Injectable } from '@angular/core';
import { CfUser } from '../../../../../store/types/user.types';
import { getOrgRolesString } from '../../../../../features/cloud-foundry/cf.helpers';
import { TableCellCfUserPermissionComponent } from './cf-user-permission-cell/cf-user-permission-cell.component';
import { CfSpacePermissionCellComponent } from './cf-space-permission-cell/cf-space-permission-cell.component';

@Injectable()
export class CfUserListConfigService extends ListConfig<APIResource<CfUser>> {
  isLocal = true;
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: CfUserDataSourceService;
  columns: ITableColumn<APIResource<CfUser>>[];
  text = {
    title: null,
    noEntries: 'There are no users'
  };

  constructor(private store: Store<AppState>, cfUserService: CfUserService) {
    super();
    this.columns = [
      {
        columnId: 'username',
        headerCell: () => 'Username',
        cellFlex: '1',
        cellAlignSelf: 'baseline',
        cellDefinition: {
          getValue: row => row.entity.username || row.metadata.guid
        },
      },
      {
        columnId: 'roles',
        headerCell: () => 'Organization Roles',
        cellFlex: '3',
        cellAlignSelf: 'baseline',
        cellComponent: TableCellCfUserPermissionComponent
      },
      {
        columnId: 'space-roles',
        headerCell: () => 'Space Roles',
        cellFlex: '3',
        cellAlignSelf: 'baseline',
        cellComponent: CfSpacePermissionCellComponent
      },

    ];
    this.dataSource = new CfUserDataSourceService(store, cfUserService.allUsersAction, this);
  }

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;

}
