import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { DeleteRoute, UnmapRoute } from '../../../../../store/actions/route.actions';
import { GetSpaceRoutes } from '../../../../../store/actions/space.actions';
import { AppState } from '../../../../../store/app-state';
import {
  applicationSchemaKey,
  domainSchemaKey,
  routeSchemaKey,
  spaceSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { CfAppRoutesDataSource } from './cf-app-routes-data-source';
import { TableCellAppRouteComponent } from './table-cell-app-route/table-cell-app-route.component';
import { TableCellRadioComponent } from './table-cell-radio/table-cell-radio.component';
import { TableCellRouteComponent } from './table-cell-route/table-cell-route.component';
import { TableCellTCPRouteComponent } from './table-cell-tcproute/table-cell-tcproute.component';

@Injectable()
export class CfAppMapRoutesListConfigService implements IListConfig<APIResource> {
  routesDataSource: CfAppRoutesDataSource;

  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'radio',
      headerCell: () => '',
      cellComponent: TableCellRadioComponent,
      class: 'table-column-select',
      cellFlex: '1'
    },
    {
      columnId: 'route',
      headerCell: () => 'Route',
      cellComponent: TableCellRouteComponent,
      sort: {
        type: 'sort',
        orderKey: 'route',
        field: 'entity.host'
      },
      cellFlex: '3'
    },
    {
      columnId: 'tcproute',
      headerCell: () => 'TCP Route',
      cellComponent: TableCellTCPRouteComponent,
      sort: {
        type: 'sort',
        orderKey: 'tcproute',
        field: 'entity.isTCPRoute'
      },
      cellFlex: '3'
    },
    {
      columnId: 'attachedApps',
      headerCell: () => 'Apps Attached',
      cellComponent: TableCellAppRouteComponent,
      sort: {
        type: 'sort',
        orderKey: 'attachedApps',
        field: 'entity.mappedAppsCount'
      },
      cellFlex: '3'
    }
  ];

  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Available Routes',
    noEntries: 'There are no routes'
  };
  isLocal = true;

  dispatchDeleteAction(route) {
    return this.store.dispatch(
      new DeleteRoute(route.metadata.guid, this.routesDataSource.cfGuid)
    );
  }

  dispatchUnmapAction(route) {
    return this.store.dispatch(
      new UnmapRoute(
        route.metadata.guid,
        this.routesDataSource.appGuid,
        this.routesDataSource.cfGuid
      )
    );
  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.routesDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private confirmDialog: ConfirmationDialogService,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    const spaceGuid = activatedRoute.snapshot.queryParamMap.get('spaceGuid');
    this.routesDataSource = new CfAppRoutesDataSource(
      this.store,
      this.appService,
      new GetSpaceRoutes(spaceGuid, appService.cfGuid, createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid), [
        createEntityRelationKey(spaceSchemaKey, routeSchemaKey),
        createEntityRelationKey(routeSchemaKey, domainSchemaKey),
        createEntityRelationKey(routeSchemaKey, applicationSchemaKey)
      ]),
      createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid),
      true,
      this
    );
  }
}
