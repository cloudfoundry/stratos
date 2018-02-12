import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/app-state';
import { selectUpdateInfo } from '../../../../../store/selectors/api.selectors';
import { EndpointModel, endpointStoreNames } from '../../../../../store/types/endpoint.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { EndpointsListConfigService } from '../endpoint/endpoints-list-config.service';
import { CFEndpointsDataSource } from './cf-endpoints-data-source';
import { TableCellEndpointStatusComponent } from '../endpoint/table-cell-endpoint-status/table-cell-endpoint-status.component';


function getEndpointTypeString(endpoint: EndpointModel): string {
  return endpoint.cnsi_type === 'cf' ? 'Cloud Foundry' : endpoint.cnsi_type;
}

@Injectable()
export class CFEndpointsListConfigService implements IListConfig<EndpointModel> {

  // private listActionDelete: IListAction<EndpointModel> = {
  //   action: (item) => {
  //     this.store.dispatch(new UnregisterEndpoint(item.guid));
  //     this.handleAction(item, EndpointsEffect.unregisteringKey, ([oldVal, newVal]) => {
  //       this.store.dispatch(new ShowSnackBar(`Unregistered ${item.name}`));
  //       this.store.dispatch(new ResetPagination(this.dataSource.entityKey, this.dataSource.paginationKey));
  //     });
  //   },
  //   icon: 'delete',
  //   label: 'Unregister',
  //   description: 'Remove the endpoint',
  //   visible: row => true,
  //   enabled: row => true,
  // };

  // private listActionDeleteMulti: IMultiListAction<EndpointModel> = {
  //   action: (item) => {
  //     return null;
  //   },
  //   icon: 'delete',
  //   label: 'Unregister',
  //   description: 'Remove the endpoint',
  //   visible: row => true,
  //   enabled: row => true,
  // };

  // private listActionDisconnect: IListAction<EndpointModel> = {
  //   action: (item) => {
  //     this.store.dispatch(new DisconnectEndpoint(item.guid));
  //     this.handleAction(item, EndpointsEffect.disconnectingKey, ([oldVal, newVal]) => {
  //       this.store.dispatch(new ShowSnackBar(`Disconnected ${item.name}`));
  //       this.store.dispatch(new GetSystemInfo());
  //     });
  //   },
  //   icon: 'remove_from_queue',
  //   label: 'Disconnect',
  //   description: ``, // Description depends on console user permission
  //   visible: row => row.connectionStatus === 'connected',
  //   enabled: row => true,
  // };

  // private listActionConnect: IListAction<EndpointModel> = {
  //   action: (item) => {
  //     const dialogRef = this.dialog.open(ConnectEndpointDialogComponent, {
  //       data: {
  //         name: item.name,
  //         guid: item.guid
  //       },
  //       disableClose: true
  //     });
  //   },
  //   icon: 'add_to_queue',
  //   label: 'Connect',
  //   description: '',
  //   visible: row => row.connectionStatus === 'disconnected',
  //   enabled: row => true,
  // };


  columns: ITableColumn<EndpointModel>[];
  isLocal = true;
  dataSource: CFEndpointsDataSource;
  pageSizeOptions = [9, 18, 27];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: '',
    filter: 'Filter Endpoints'
  };
  enableTextFilter = true;
  tableFixedRowHeight = true;

  private handleAction(item, effectKey, handleChange) {
    const disSub = this.store.select(selectUpdateInfo(
      endpointStoreNames.type,
      item.guid,
      effectKey,
    ))
      .pairwise()
      .subscribe(([oldVal, newVal]) => {
        if (!newVal.error && (oldVal.busy && !newVal.busy)) {
          handleChange([oldVal, newVal]);
          disSub.unsubscribe();
        }
      });
  }

  constructor(
    private store: Store<AppState>,
    private dialog: MatDialog,
    private endpointsListConfigService: EndpointsListConfigService
  ) {
    this.columns = endpointsListConfigService.getColumns().filter(column => {
      return column.columnId !== 'type';
    });
    this.dataSource = new CFEndpointsDataSource(this.store, this);
  }
  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getDataSource = () => this.dataSource;
  public getMultiFiltersConfigs = () => [];


}
