import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';

import { Store } from '@ngrx/store';

import { CurrentUserPermissions } from '../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import {
  ConnectEndpointDialogComponent,
} from '../../../../../features/endpoints/connect-endpoint-dialog/connect-endpoint-dialog.component';
import {
  getFullEndpointApiUrl,
  getNameForEndpointType,
  getEndpointUsername,
} from '../../../../../features/endpoints/endpoint-helpers';
import { DisconnectEndpoint, UnregisterEndpoint } from '../../../../../store/actions/endpoint.actions';
import { ShowSnackBar } from '../../../../../store/actions/snackBar.actions';
import { GetSystemInfo } from '../../../../../store/actions/system.actions';
import { AppState } from '../../../../../store/app-state';
import { EndpointsEffect } from '../../../../../store/effects/endpoint.effects';
import { selectDeletionInfo, selectUpdateInfo } from '../../../../../store/selectors/api.selectors';
import { EndpointModel, endpointStoreNames } from '../../../../../store/types/endpoint.types';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, ListViewTypes } from '../../list.component.types';
import { EndpointsDataSource } from './endpoints-data-source';
import { TableCellEndpointNameComponent } from './table-cell-endpoint-name/table-cell-endpoint-name.component';
import { TableCellEndpointStatusComponent } from './table-cell-endpoint-status/table-cell-endpoint-status.component';

import { map, pairwise } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';
import { TableCellEndpointIsAdminComponent } from './table-cell-endpoint-is-admin/table-cell-endpoint-is-admin.component';


function getEndpointTypeString(endpoint: EndpointModel): string {
  return getNameForEndpointType(endpoint.cnsi_type);
}

export const endpointColumns: ITableColumn<EndpointModel>[] = [
  {
    columnId: 'name',
    headerCell: () => 'Name',
    cellComponent: TableCellEndpointNameComponent,
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
    cellDefinition: {
      getValue: getEndpointTypeString
    },
    sort: {
      type: 'sort',
      orderKey: 'type',
      field: 'cnsi_type'
    },
    cellFlex: '2'
  },
  {
    columnId: 'username',
    headerCell: () => 'Username',
    cellDefinition: {
      getValue: getEndpointUsername
    },
    sort: {
      type: 'sort',
      orderKey: 'username',
      field: 'user.name'
    },
    cellFlex: '2'
  },
  {
    columnId: 'user-type',
    headerCell: () => 'Admin',
    cellComponent: TableCellEndpointIsAdminComponent,
    sort: {
      type: 'sort',
      orderKey: 'user-type',
      field: 'user.admin'
    },
    cellFlex: '2'
  },
  {
    columnId: 'address',
    headerCell: () => 'Address',
    cellDefinition: {
      getValue: getFullEndpointApiUrl
    },
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
      const confirmation = new ConfirmationDialogConfig(
        'Unregister Endpoint',
        `Are you sure you want to unregister endpoint '${item.name}'?`,
        'Unregister',
        true
      );
      this.confirmDialog.open(confirmation, () => {
        this.store.dispatch(new UnregisterEndpoint(item.guid, item.cnsi_type));
        this.handleDeleteAction(item, ([oldVal, newVal]) => {
          this.store.dispatch(new ShowSnackBar(`Unregistered ${item.name}`));
        });
      });
    },
    label: 'Unregister',
    description: 'Remove the endpoint',
    createVisible: () => this.currentUserPermissionsService.can(CurrentUserPermissions.ENDPOINT_REGISTER)
  };

  private listActionDisconnect: IListAction<EndpointModel> = {
    action: (item) => {
      const confirmation = new ConfirmationDialogConfig(
        'Disconnect Endpoint',
        `Are you sure you want to disconnect endpoint '${item.name}'?`,
        'Disconnect',
        false
      );
      this.confirmDialog.open(confirmation, () => {
        this.store.dispatch(new DisconnectEndpoint(item.guid, item.cnsi_type));
        this.handleUpdateAction(item, EndpointsEffect.disconnectingKey, ([oldVal, newVal]) => {
          this.store.dispatch(new ShowSnackBar(`Disconnected endpoint '${item.name}'`));
          this.store.dispatch(new GetSystemInfo());
        });
      });
    },
    label: 'Disconnect',
    description: ``, // Description depends on console user permission
    createVisible: (row$: Observable<EndpointModel>) => combineLatest(
      this.currentUserPermissionsService.can(CurrentUserPermissions.ENDPOINT_REGISTER),
      row$
    ).pipe(
      map(([isAdmin, row]) => {
        const isConnected = row.connectionStatus === 'connected';
        return isConnected && (!row.system_shared_token || row.system_shared_token && isAdmin);
      })
    )
  };

  private listActionConnect: IListAction<EndpointModel> = {
    action: (item) => {
      this.dialog.open(ConnectEndpointDialogComponent, {
        data: {
          name: item.name,
          guid: item.guid,
          type: item.cnsi_type,
          ssoAllowed: item.sso_allowed
        },
        disableClose: true
      });
    },
    label: 'Connect',
    description: '',
    createVisible: (row$: Observable<EndpointModel>) => row$.pipe(map(row => row.connectionStatus === 'disconnected'))
  };

  private singleActions = [
    this.listActionDisconnect,
    this.listActionConnect,
    this.listActionDelete
  ];

  private globalActions = [];

  columns = endpointColumns;
  isLocal = true;
  dataSource: EndpointsDataSource;
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
    const disSub = this.store.select(storeSelect).pipe(
      pairwise())
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
    private dialog: MatDialog,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private entityMonitorFactory: EntityMonitorFactory,
    private internalEventMonitorFactory: InternalEventMonitorFactory,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private confirmDialog: ConfirmationDialogService
  ) {
    this.dataSource = new EndpointsDataSource(
      this.store,
      this,
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory
    );
  }

  public getGlobalActions = () => this.globalActions;
  public getMultiActions = () => [];
  public getSingleActions = () => this.singleActions;
  public getColumns = () => this.columns;
  public getDataSource = () => this.dataSource;
  public getMultiFiltersConfigs = () => [];
}
