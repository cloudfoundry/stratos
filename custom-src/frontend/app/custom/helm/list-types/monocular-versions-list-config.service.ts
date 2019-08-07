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
  tableFixedRowHeight = true;
  columns: ITableColumn<HelmVersion>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Cluster',
      cellComponent: TableCellEndpointNameComponent,
      cellFlex: '2'
    },
    {
      columnId: 'version',
      headerCell: () => 'Helm Version',
      cellDefinition: {
        getValue: (version) => version.Version ? version.Version.sem_ver : 'Not installed'
      },
      sort: {
        type: 'sort',
        orderKey: 'version',
        field: 'Version.sem_ver'
      },
      cellFlex: '1'
    },
  ];


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
  public getFilters = () => [];
  public setFilter = (id: string) => null;
  public getDataSource = () => this.dataSource;
}
