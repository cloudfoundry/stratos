import { isTCPRoute } from '../../../../../features/applications/routes/routes.helper';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import {
  DeleteRoute,
  GetSpaceRoutes,
  UnmapRoute
} from '../../../../../store/actions/route.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { ITableColumn } from '../../list-table/table.types';
import {
  IMultiListAction,
  ListViewTypes,
  IListConfig
} from '../../list.component.types';
import { CfAppRoutesDataSource } from './cf-app-routes-data-source';
import { TableCellAppRouteComponent } from './table-cell-app-route/table-cell-app-route.component';
import { TableCellRadioComponent } from './table-cell-radio/table-cell-radio.component';
import { TableCellRouteComponent } from './table-cell-route/table-cell-route.component';
import { TableCellTCPRouteComponent } from './table-cell-tcproute/table-cell-tcproute.component';
import { PaginationEntityState } from '../../../../../store/types/pagination.types';

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

  pageSizeOptions = [5, 15, 30];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Available Routes'
  };
  isLocal = true;

  dispatchDeleteAction(route) {
    return this.store.dispatch(
      new DeleteRoute(route.entity.guid, this.routesDataSource.cfGuid)
    );
  }

  dispatchUnmapAction(route) {
    return this.store.dispatch(
      new UnmapRoute(
        route.entity.guid,
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
      new GetSpaceRoutes(spaceGuid, appService.cfGuid),
      getPaginationKey('route', appService.cfGuid, spaceGuid),
      true,
      this
    );
  }
}
