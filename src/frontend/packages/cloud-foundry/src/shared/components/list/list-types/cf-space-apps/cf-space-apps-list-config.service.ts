import type { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  createTableColumnFavorite,
  type ITableColumn,
  defaultPaginationPageSizeOptionsTable,
  type IGlobalListAction,
  type IListAction,
  type IListConfig,
  type IListMultiFilterConfig,
  type IMultiListAction,
  ListViewTypes,
} from '@stratosui/core';
import { type ListView, type APIResource, UserFavorite, type GeneralEntityAppState } from '@stratosui/store';
import type { CFAppState } from '../../../../../cf-app-state';
import { applicationEntityType } from '../../../../../cf-entity-types';
import type { ISpaceFavMetadata } from '../../../../../cf-metadata-types';
import type { IApp } from '../../../../../cf-api.types';
import type { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { TableCellAppNameComponent } from '../app/table-cell-app-name/table-cell-app-name.component';
import { TableCellAppStatusComponent } from '../app/table-cell-app-status/table-cell-app-status.component';
import { CfSpaceAppsDataSource } from './cf-space-apps-data-source.service';

@Injectable({
  providedIn: 'root'
})
export class CfSpaceAppsListConfigService implements IListConfig<APIResource<IApp>> {
  isLocal = false;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  dataSource: CfSpaceAppsDataSource;
  defaultView = 'table' as ListView;
  text = {
    title: null as string | null,
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
        getValue: (row: APIResource<IApp>) => `${row.entity.instances}`
      },
      cellFlex: '1'
    },
    {
      columnId: 'creation', headerCell: () => 'Creation Date',
      cellDefinition: {
        getValue: (row: APIResource<IApp>) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
      },
      sort: {
        type: 'sort',
        orderKey: 'creation',
        field: 'metadata.created_at'
      },
      cellFlex: '2'
    },
    createTableColumnFavorite((row: APIResource<IApp>): UserFavorite<ISpaceFavMetadata> => {
      return new UserFavorite(
        row.entity.cfGuid,
        'cf',
        applicationEntityType,
        row.metadata.guid,
      );
    }),
  ]

  constructor(
    private store: Store<GeneralEntityAppState>,
    private datePipe: DatePipe,cfSpaceService: CloudFoundrySpaceService
  ) {
    this.dataSource = new CfSpaceAppsDataSource(this.store, cfSpaceService, this);
  }

  getGlobalActions = (): IGlobalListAction<APIResource<IApp>>[] => [];
  getMultiActions = (): IMultiListAction<APIResource<IApp>>[] => [];
  getSingleActions = (): IListAction<APIResource<IApp>>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getDataSource = () => this.dataSource;
}
