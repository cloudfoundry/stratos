import {
  ConnectEndpointDialogComponent,
} from '../../features/endpoints/connect-endpoint-dialog/connect-endpoint-dialog.component';
import { ITableColumn } from '../components/table/table.types';
import { AppState } from '../../store/app-state';
import { TableCellActionsComponent } from '../components/table/table-cell-actions/table-cell-actions.component';
import { TableCellSelectComponent } from '../components/table/table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../components/table/table-header-select/table-header-select.component';
import { Action, Store } from '@ngrx/store';
import { CNSISModel } from '../../store/types/cnsis.types';
import { RouterNav } from '../../store/actions/router.actions';
import { ConnectCnis } from '../../store/actions/cnsis.actions';
import { EndpointsDataSource } from '../data-sources/endpoints-data-source';
import { IGlobalListAction, IListAction, IListConfig, IMultiListAction } from '../components/list/list.component';
import { Injectable } from '@angular/core';
import { MdDialog } from '@angular/material';


function getEndpointTypeString(endpoint: CNSISModel): string {
  return endpoint.cnsi_type === 'cf' ? 'Cloud Foundry' : endpoint.cnsi_type;
}

@Injectable()
export class EndpointsListConfigService implements IListConfig<CNSISModel> {

  private listActionDelete: IListAction<CNSISModel> = {
    action: (item) => {
      return null;
    },
    icon: 'delete',
    label: 'Unregister',
    description: 'Remove the endpoint',
    visible: row => true,
    enabled: row => true,
  };

  private listActionDeleteMulti: IMultiListAction<CNSISModel> = {
    action: (item) => {
      return null;
    },
    icon: 'delete',
    label: 'Unregister',
    description: 'Remove the endpoint',
    visible: row => true,
    enabled: row => true,
  };

  private listActionAdd: IGlobalListAction<CNSISModel> = {
    action: () => {
      this.store.dispatch(new RouterNav({ path: ['endpoints', 'new'] }));
    },
    icon: 'add',
    label: 'Add',
    description: '',
    visible: row => true,
    enabled: row => true,
  };

  private listActionDisconnect: IListAction<CNSISModel> = {
    action: (item) => {
      return null;
    },
    icon: 'remove_from_queue',
    label: 'Disconnect',
    description: `Disconnect but don't delete`,
    visible: row => row.registered,
    enabled: row => true,
  };

  private listActionConnect: IListAction<CNSISModel> = {
    action: (item) => {
      const dialogRef = this.dialog.open(ConnectEndpointDialogComponent, {
        data: {
          name: item.name,
          guid: item.guid
        },
        disableClose: true
      });
    },
    icon: 'add_to_queue',
    label: 'Connect',
    description: '',
    visible: row => !row.registered,
    enabled: row => true,
  };


  private singleActions = [
    this.listActionDisconnect,
    this.listActionConnect,
    this.listActionDelete
  ];

  private multiActions = [this.listActionDeleteMulti];
  private globalActions = [this.listActionAdd];

  columns: ITableColumn<CNSISModel>[] = [
    {
      columnId: 'select',
      headerCellComponent: TableHeaderSelectComponent,
      cellComponent: TableCellSelectComponent,
      class: 'table-column-select', cellFlex: '1'
    },
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cell: row => row.name,
      sort: true,
      cellFlex: '2'
    },
    {
      columnId: 'connection',
      headerCell: () => 'Connection',
      cell: row => row.registered ? 'Connected' : 'Disconnected',
      sort: true, cellFlex: '1'
    },
    {
      columnId: 'type',
      headerCell: () => 'Type',
      cell: getEndpointTypeString,
      sort: true,
      cellFlex: '2'
    },
    {
      columnId: 'address',
      headerCell: () => 'Address',
      cell: row => `${row.api_endpoint.Scheme}://${row.api_endpoint.Host}`,
      sort: true,
      cellFlex: '5'
    },
    // {
    //   columnId: 'edit', headerCell: () => '', cellComponent: TableCellEditComponent, class: 'table-column-edit', cellFlex: '1'
    // },
    {
      columnId: 'edit',
      headerCell: () => 'Actions',
      cellComponent: TableCellActionsComponent,
      class: 'table-column-edit',
      cellFlex: '1'
    },
  ];

  dataSource: EndpointsDataSource;

  constructor(
    private store: Store<AppState>,
    private dialog: MdDialog
  ) {
    this.dataSource = new EndpointsDataSource(this.store);
  }

  public getGlobalActions = () => this.globalActions;
  public getMultiActions = () => this.multiActions;
  public getSingleActions = () => this.singleActions;
  public getColumns = () => this.columns;
  public getDataSource = () => this.dataSource;

}
