import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IApp } from '../../../../../core/cf-api.types';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { ITableColumn } from '../../list-table/table.types';
import { defaultPaginationPageSizeOptionsTable, IListConfig, ListViewTypes } from '../../list.component.types';
import { TableCellAppNameComponent } from '../app/table-cell-app-name/table-cell-app-name.component';
import { TableCellAppStatusComponent } from '../app/table-cell-app-status/table-cell-app-status.component';
import { CfSpaceAppsDataSource } from './cf-space-apps-data-source.service';

@Injectable()
export class CfSpaceAppsListConfigService implements IListConfig<APIResource> {
  isLocal = false;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  dataSource: CfSpaceAppsDataSource;
  defaultView = 'table' as ListView;
  text = {
    title: null,
    noEntries: 'There are no applications'
  };
  pageSizeOptions = defaultPaginationPageSizeOptionsTable;

  getColumns = (): ITableColumn<APIResource<IApp>>[] => [
    {
      columnId: 'apps', headerCell: () => 'Applications',
      cellComponent: TableCellAppNameComponent,
      cellFlex: '1',
    },
    {
      columnId: 'status',
      headerCell: () => 'Status',
      cellFlex: '2',
      cellConfig: {
        hideIcon: true,
        initialStateOnly: true
      },
      cellComponent: TableCellAppStatusComponent
    },
    {
      columnId: 'instances',
      headerCell: () => 'Instances',
      cellDefinition: {
        getValue: (row: APIResource) => `${row.entity.instances}`
      },
      cellFlex: '1'
    },
    {
      columnId: 'creation', headerCell: () => 'Creation Date',
      cellDefinition: {
        getValue: (row: APIResource) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
      },
      sort: {
        type: 'sort',
        orderKey: 'creation',
        field: 'metadata.created_at'
      },
      cellFlex: '2'
    },
  ]

  constructor(
    private store: Store<AppState>,
    private datePipe: DatePipe,
    private cfSpaceService: CloudFoundrySpaceService
  ) {
    this.dataSource = new CfSpaceAppsDataSource(this.store, cfSpaceService, this);
  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
