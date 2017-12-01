import { ITableColumn } from '../components/table/table.types';
import { CfListDataSource } from '../data-sources/list-data-source-cf';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  TableCellAppNameComponent,
} from '../components/table/custom-cells/table-cell-app-name/table-cell-app-name.component';
import { CfAppsDataSource } from '../data-sources/cf-apps-data-source';
import { APIResource } from '../../store/types/api.types';
import { Injectable } from '@angular/core';
import { IListDataSource } from '../data-sources/list-data-source';
import { EntityInfo } from '../../store/types/api.types';
import { IListAction, IListConfig, IMultiListAction } from '../components/list/list.component';
import { AppState } from '../../store/app-state';

@Injectable()
export class CfAppConfigService implements IListConfig<APIResource> {

  constructor(
    private datePipe: DatePipe,
    private store: Store<AppState>
  ) {
    this.appsDataSource = new CfAppsDataSource(this.store);
  }
  appsDataSource: CfAppsDataSource;
  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'name', headerCell: () => 'Application Name', cellComponent: TableCellAppNameComponent, cellFlex: '2'
    },
    {
      columnId: 'status', headerCell: () => 'Status', cell: (row: APIResource) => `${row.entity.state}`, cellFlex: '1'
    },
    {
      columnId: 'instances', headerCell: () => 'Instances', cell: (row: APIResource) => `${row.entity.instances}`, cellFlex: '1'
    },
    {
      columnId: 'disk', headerCell: () => 'Disk Quota', cell: (row: APIResource) => ``, cellFlex: '1'
    },
    {
      columnId: 'memory', headerCell: () => 'Memory', cell: (row: APIResource) => ``, cellFlex: '1'
    },
    {
      columnId: 'creation', headerCell: () => 'Creation Date',
      cell: (row: APIResource) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`, sort: true,
      cellFlex: '2'
    },
  ];

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getColumns = () => this.columns;
  getDataSource = () => this.appsDataSource;
}
