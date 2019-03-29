import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import {
  TableCellEndpointNameComponent,
} from '../../../shared/components/list/list-types/endpoint/table-cell-endpoint-name/table-cell-endpoint-name.component';
import { IListConfig, ListViewTypes } from '../../../shared/components/list/list.component.types';
import { HelmVersion } from '../store/helm.types';
import { HelmVersionsDataSource } from './monocular-versions-list-source';

@Injectable()
export class HelmVersionsListConfig implements IListConfig<HelmVersion> {
  isLocal = true;
  dataSource: HelmVersionsDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: '',
    filter: 'Filter Kubernetes',
    noEntries: 'There are no helm versions'
  };
  enableTextFilter = true;
  tableFixedRowHeight = true;
  columns = [
    {
      columnId: 'name',
      headerCell: () => 'Cluster',
      cellComponent: TableCellEndpointNameComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'version',
      headerCell: () => 'Helm Version',
      cellDefinition: {
        valuePath: 'Version.sem_ver'
      },
      sort: {
        type: 'sort',
        orderKey: 'version',
        field: 'Version.sem_ver'
      },
      cellFlex: '1'
    },
  ] as ITableColumn<HelmVersion>[];


  constructor(
    private store: Store<AppState>,
    public activatedRoute: ActivatedRoute,
  ) {
    this.dataSource = new HelmVersionsDataSource(this.store, this);
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
}
