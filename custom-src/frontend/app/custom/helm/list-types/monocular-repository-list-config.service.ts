import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { UnregisterEndpoint } from 'frontend/packages/store/src/actions/endpoint.actions';
import { entityCatalog } from 'frontend/packages/store/src/entity-catalog/entity-catalog';
import { endpointSchemaKey } from 'frontend/packages/store/src/helpers/entity-factory';
import { selectDeletionInfo } from 'frontend/packages/store/src/selectors/api.selectors';
import { of as observableOf } from 'rxjs';
import { pairwise } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { STRATOS_ENDPOINT_TYPE } from '../../../base-entity-schemas';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../core/current-user-permissions.service';
import { environment } from '../../../environments/environment';
import { getFullEndpointApiUrl } from '../../../features/endpoints/endpoint-helpers';
import { ConfirmationDialogConfig } from '../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import {
  EndpointCardComponent,
} from '../../../shared/components/list/list-types/endpoint/endpoint-card/endpoint-card.component';
import {
  TableCellEndpointStatusComponent,
} from '../../../shared/components/list/list-types/endpoint/table-cell-endpoint-status/table-cell-endpoint-status.component';
import { IListAction, IListConfig, ListViewTypes } from '../../../shared/components/list/list.component.types';
import { defaultHelmKubeListPageSize } from '../../kubernetes/list-types/kube-helm-list-types';
import { MonocularRepositoryDataSource } from './monocular-repository-list-source';

@Injectable()
export class MonocularRepositoryListConfig implements IListConfig<EndpointModel> {
  isLocal = true;
  dataSource: MonocularRepositoryDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  cardComponent = EndpointCardComponent;
  text = {
    title: '',
    filter: 'Filter Repositories',
    noEntries: 'There are no repositories'
  };
  pageSizeOptions = defaultHelmKubeListPageSize;
  enableTextFilter = true;
  columns: ITableColumn<EndpointModel>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        valuePath: 'name'
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
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
      cellFlex: '7'
    },
    {
      columnId: 'status',
      headerCell: () => 'Status',
      cellComponent: TableCellEndpointStatusComponent,
      cellConfig: {
        showLabel: true
      },
      cellFlex: '2'
    },
  ];

  private endpointEntityKey = entityCatalog.getEntityKey(STRATOS_ENDPOINT_TYPE, endpointSchemaKey);

  private listActionSyncRepository: IListAction<EndpointModel> = {
    action: (item: EndpointModel) => {
      const requestArgs = {
        headers: null,
        params: null
      };
      const proxyAPIVersion = environment.proxyAPIVersion;
      const url = `/pp/${proxyAPIVersion}/chartrepos/${item.guid}`;
      const req = this.httpClient.post(url, requestArgs);
      req.subscribe(ok => {
        this.snackBar.open('Helm Repository synchronization started', 'Dismiss', { duration: 3000 });
        // Refresh repository status
        this.dataSource.refresh();
      }, err => {
        this.snackBar.open(`Failed to Synchronize Helm Repository '${item.name}'`, 'Dismiss', { duration: 5000 });
      });
      return req;
    },
    label: 'Synchronize',
    description: '',
    createVisible: () => observableOf(true),
    createEnabled: () => observableOf(true)
  };

  private deleteRepository: IListAction<EndpointModel> = {
    action: (item) => {
      const confirmation = new ConfirmationDialogConfig(
        'Delete Helm Repository',
        `Are you sure you want to delete repository '${item.name}'?`,
        'Delete',
        true
      );
      this.confirmDialog.open(confirmation, () => {
        this.store.dispatch(new UnregisterEndpoint(item.guid, item.cnsi_type));
        this.handleDeleteAction(item, ([oldVal, newVal]) => {
          this.snackBar.open(`Delete Helm Repository '${item.name}'`, 'Dismiss', { duration: 3000 });
        });
      });
    },
    label: 'Delete',
    description: 'Delete Helm Repository',
    createVisible: () => this.currentUserPermissionsService.can(CurrentUserPermissions.ENDPOINT_REGISTER)
  };

  private handleDeleteAction(item, handleChange) {
    this.handleAction(selectDeletionInfo(
      this.endpointEntityKey,
      item.guid,
    ), handleChange);
  }

  private handleAction(storeSelect, handleChange) {
    const disSub = this.store.select(storeSelect).pipe(
      pairwise())
      .subscribe(([oldVal, newVal]) => {
        if (!newVal.error && (oldVal.busy && !newVal.busy)) {
          handleChange([oldVal, newVal]);
          disSub.unsubscribe();
        }
      });
  }

  constructor(
    public store: Store<AppState>,
    public activatedRoute: ActivatedRoute,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
    ngZone: NgZone,
    public httpClient: HttpClient,
    public snackBar: MatSnackBar,
    public confirmDialog: ConfirmationDialogService,
    public currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    const highlighted = activatedRoute.snapshot.params.guid;
    this.dataSource = new MonocularRepositoryDataSource(
      this.store,
      this,
      highlighted,
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory,
      ngZone
    );
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [this.listActionSyncRepository, this.deleteRepository];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
}
