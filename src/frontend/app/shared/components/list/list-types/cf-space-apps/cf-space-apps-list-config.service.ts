import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { CfSpaceAppsDataSource } from './cf-space-apps-data-source.service';
import { ITableColumn } from '../../list-table/table.types';
import { TableCellAppNameComponent } from '../app/table-cell-app-name/table-cell-app-name.component';
import { TableCellAppStatusComponent } from '../app/table-cell-app-status/table-cell-app-status.component';
import { DatePipe } from '@angular/common';
import { TableCellAppInstancesComponent } from '../app/table-cell-app-instances/table-cell-app-instances.component';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { IApp } from '../../../../../core/cf-api.types';

@Injectable()
export class CfSpaceAppsListConfigService implements IListConfig<APIResource> {
  isLocal?: boolean;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  tableFixedRowHeight?: boolean;
  dataSource: CfSpaceAppsDataSource;
  pageSizeOptions = [9, 45, 90];
  defaultView = 'table' as ListView;
  text = {
    title: null,
    noEntries: 'There are no applications'
  };

  getColumns = (): ITableColumn<APIResource<IApp>>[] => [
    {
      columnId: 'apps', headerCell: () => 'Applications',
      cellComponent: TableCellAppNameComponent,
      cellFlex: '1',
      sort: {
        type: 'sort',
        orderKey: 'apps',
        field: 'entity.name'
      }
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
    {
      columnId: 'instances',
      headerCell: () => 'Instances',
      cellDefinition: {
        getValue: (row: APIResource) => `${row.entity.instances}`
      },
      cellFlex: '1', sort: {
        type: 'sort',
        orderKey: 'instances',
        field: 'entity.instances'
      }
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
