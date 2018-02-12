import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';

import {
  ConnectEndpointDialogComponent,
} from '../../../../../features/endpoints/connect-endpoint-dialog/connect-endpoint-dialog.component';
import { DisconnectCnis, UnregisterCnis } from '../../../../../store/actions/cnsis.actions';
import { ResetPagination } from '../../../../../store/actions/pagination.actions';
import { ShowSnackBar } from '../../../../../store/actions/snackBar.actions';
import { GetSystemInfo } from '../../../../../store/actions/system.actions';
import { AppState } from '../../../../../store/app-state';
import { CNSISEffect } from '../../../../../store/effects/cnsis.effects';
import { selectUpdateInfo } from '../../../../../store/selectors/api.selectors';
import { CNSISModel, cnsisStoreNames } from '../../../../../store/types/cnsis.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, IMultiListAction, ListViewTypes } from '../../list.component.types';
import { EndpointsDataSource } from './endpoints-data-source';
import { TableCellEndpointStatusComponent } from './table-cell-endpoint-status/table-cell-endpoint-status.component';


function getEndpointTypeString(endpoint: CNSISModel): string {
  return endpoint.cnsi_type === 'cf' ? 'Cloud Foundry' : endpoint.cnsi_type;
}

@Injectable()
export class EndpointsListConfigService implements IListConfig<CNSISModel> {

  private listActionDelete: IListAction<CNSISModel> = {
    action: (item) => {
      this.store.dispatch(new UnregisterCnis(item.guid));
      this.handleAction(item, CNSISEffect.unregisteringKey, ([oldVal, newVal]) => {
        this.store.dispatch(new ShowSnackBar(`Unregistered ${item.name}`));
        this.store.dispatch(new ResetPagination(this.dataSource.entityKey, this.dataSource.paginationKey));
      });
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

  private listActionDisconnect: IListAction<CNSISModel> = {
    action: (item) => {
      this.store.dispatch(new DisconnectCnis(item.guid));
      this.handleAction(item, CNSISEffect.disconnectingKey, ([oldVal, newVal]) => {
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

  private listActionConnect: IListAction<CNSISModel> = {
    action: (item) => {
      console.log(item);
      const dialogRef = this.dialog.open(ConnectEndpointDialogComponent, {
        data: {
          name: item.name,
          guid: item.guid,
          type: item.cnsi_type,
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

  columns: ITableColumn<CNSISModel>[] = [
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

  private handleAction(item, effectKey, handleChange) {
    const disSub = this.store.select(selectUpdateInfo(
      cnsisStoreNames.type,
      item.guid,
      effectKey,
    ))
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
