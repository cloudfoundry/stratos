import { APIResource } from './../../../../../store/types/api.types';
import { ITableColumn } from './../../list-table/table.types';
import { CfUserService } from './../../../../data-services/cf-user.service';
import { AppState } from './../../../../../store/app-state';
import { Store } from '@ngrx/store';
import { CfUserDataSourceService } from './cf-user-data-source.service';
import { ListViewTypes, ListConfig } from './../../list.component.types';
import { Injectable } from '@angular/core';
import { CfUser } from '../../../../../store/types/user.types';

@Injectable()
export class CfUserListConfigService extends ListConfig<APIResource<CfUser>> {
  isLocal = true;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  dataSource: CfUserDataSourceService;
  pageSizeOptions = [9, 45, 90];

  columns: ITableColumn<APIResource<CfUser>>[] = [
    {
      columnId: 'type',
      headerCell: () => 'Type',
      cellDefinition: {
        valuePath: 'entity.type'
      }
    }
  ];

  getColumns = () => this.columns;

  constructor(private store: Store<AppState>, cfUserService: CfUserService) {
    super();
    this.dataSource = new CfUserDataSourceService(store, cfUserService, this);
  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;

}
