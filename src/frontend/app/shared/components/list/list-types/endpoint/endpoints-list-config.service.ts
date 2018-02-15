import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';

import {
  ConnectEndpointDialogComponent,
} from '../../../../../features/endpoints/connect-endpoint-dialog/connect-endpoint-dialog.component';
import { DisconnectEndpoint, UnregisterEndpoint } from '../../../../../store/actions/endpoint.actions';
import { ShowSnackBar } from '../../../../../store/actions/snackBar.actions';
import { GetSystemInfo } from '../../../../../store/actions/system.actions';
import { AppState } from '../../../../../store/app-state';
import { EndpointsEffect } from '../../../../../store/effects/endpoint.effects';
import { selectDeletionInfo, selectUpdateInfo } from '../../../../../store/selectors/api.selectors';
import { EndpointModel, endpointStoreNames } from '../../../../../store/types/endpoint.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, IMultiListAction, ListViewTypes } from '../../list.component.types';
import { EndpointsDataSource } from './endpoints-data-source';
import { TableCellEndpointStatusComponent } from './table-cell-endpoint-status/table-cell-endpoint-status.component';


function getEndpointTypeString(endpoint: EndpointModel): string {
  return endpoint.cnsi_type === 'cf' ? 'Cloud Foundry' : endpoint.cnsi_type;
}

export const endpointColumns: ITableColumn<EndpointModel>[] = [
  {
    columnId: 'name',
    headerCell: () => 'Name',
    cell: row => row.name,
    sort: {
      type: 'sort',
      orderKey: 'name',
      field: 'name'
    },
    cellFlex: '2'
  },
  {
    columnId: 'connection',
    headerCell: () => 'Status',
    cellComponent: TableCellEndpointStatusComponent,
    sort: {
      type: 'sort',
      orderKey: 'connection',
      field: 'info.user'
    },
    cellFlex: '1'
  },
  {
    columnId: 'type',
    headerCell: () => 'Type',
    cell: getEndpointTypeString,
    sort: {
      type: 'sort',
      orderKey: 'type',
      field: 'cnsi_type'
    },
    cellFlex: '2'
  },
  {
    columnId: 'address',
    headerCell: () => 'Address',
    cell: row => row.api_endpoint ? `${row.api_endpoint.Scheme}://${row.api_endpoint.Host}` : 'Unknown',
    sort: {
      type: 'sort',
      orderKey: 'address',
      field: 'api_endpoint.Host'
    },
    cellFlex: '5'
  },
];

@Injectable()
export class EndpointsListConfigService implements IListConfig<EndpointModel> {

  private listActionDelete: IListAction<EndpointModel> = {
    action: (item) => {
      this.store.dispatch(new UnregisterEndpoint(item.guid));
      this.handleDeleteAction(item, ([oldVal, newVal]) => {
        this.store.dispatch(new ShowSnackBar(`Unregistered ${item.name}`));
      });
    },
    icon: 'delete',
    label: 'Unregister',
    description: 'Remove the endpoint',
    visible: row => true,
    enabled: row => true,
  };

  private listActionDeleteMulti: IMultiListAction<EndpointModel> = {
    action: (item) => {
      return null;
    },
    icon: 'delete',
    label: 'Unregister',
    description: 'Remove the endpoint',
    visible: row => true,
    enabled: row => true,
  };

  private listActionDisconnect: IListAction<EndpointModel> = {
    action: (item) => {
      this.store.dispatch(new DisconnectEndpoint(item.guid));
      this.handleUpdateAction(item, EndpointsEffect.disconnectingKey, ([oldVal, newVal]) => {
        this.store.dispatch(new ShowSnackBar(`Disconnected ${item.name}`));
        this.store.dispatch(new GetSystemInfo());
      });
    },
    icon: 'remove_from_queue',
    label: 'Disconnect',
    description: ``, // Description depends on console user permission
    visible: row => row.connectionStatus === 'connected',
    enabled: row => true,
  };

  private listActionConnect: IListAction<EndpointModel> = {
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
    visible: row => row.connectionStatus === 'disconnected',
    enabled: row => true,
  };


  private singleActions = [
    this.listActionDisconnect,
    this.listActionConnect,
    this.listActionDelete
  ];

  private multiActions = [this.listActionDeleteMulti];
  private globalActions = [];

  columns = endpointColumns;
  isLocal = true;
  dataSource: EndpointsDataSource;
  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: '',
    filter: 'Filter Endpoints'
  };
  enableTextFilter = true;
  tableFixedRowHeight = true;

  private handleUpdateAction(item, effectKey, handleChange) {
    this.handleAction(selectUpdateInfo(
      endpointStoreNames.type,
      item.guid,
      effectKey,
    ), handleChange);
  }

  private handleDeleteAction(item, handleChange) {
    this.handleAction(selectDeletionInfo(
      endpointStoreNames.type,
      item.guid,
    ), handleChange);
  }

  private handleAction(storeSelect, handleChange) {
    const disSub = this.store.select(storeSelect)
      .pairwise()
      .subscribe(([oldVal, newVal]) => {
        // https://github.com/SUSE/stratos/issues/29 Generic way to handle errors ('Failed to disconnect X')
        if (!newVal.error && (oldVal.busy && !newVal.busy)) {
          handleChange([oldVal, newVal]);
          disSub.unsubscribe();
        }
      });
  }

  constructor(
    private store: Store<AppState>,
    private dialog: MatDialog
  ) {
    this.dataSource = new EndpointsDataSource(this.store, this);
  }

  public getGlobalActions = () => this.globalActions;
  public getMultiActions = () => this.multiActions;
  public getSingleActions = () => this.singleActions;
  public getColumns = () => this.columns;
  public getDataSource = () => this.dataSource;
  public getMultiFiltersConfigs = () => [];

}
