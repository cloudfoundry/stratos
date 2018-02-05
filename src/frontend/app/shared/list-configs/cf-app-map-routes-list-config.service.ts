import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';

import { ApplicationService } from '../../features/applications/application.service';
import { getPaginationKey } from '../../store/actions/pagination.actions';
import { DeleteRoute, GetSpaceRoutes, UnmapRoute } from '../../store/actions/route.actions';
import { AppState } from '../../store/app-state';
import { EntityInfo } from '../../store/types/api.types';
import { ConfirmationDialogService } from '../components/confirmation-dialog.service';
import { ListViewTypes } from '../components/list/list.component';
import {
  TableCellAppRouteComponent,
} from '../components/table/custom-cells/table-cell-app-route/table-cell-app-route.component';
import { TableCellRouteComponent } from '../components/table/custom-cells/table-cell-route/table-cell-route.component';
import {
  TableCellTCPRouteComponent,
} from '../components/table/custom-cells/table-cell-tcproute/table-cell-tcproute.component';
import { TableCellActionsComponent } from '../components/table/table-cell-actions/table-cell-actions.component';
import { TableCellSelectComponent } from '../components/table/table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../components/table/table-header-select/table-header-select.component';
import { ITableColumn } from '../components/table/table.types';
import { CfAppRoutesDataSource } from '../data-sources/cf-app-routes-data-source';

@Injectable()
export class CfAppMapRoutesListConfigService {
  appSubscription: Subscription;
  isLocal?: boolean;
  routesDataSource: CfAppRoutesDataSource;
  columns: Array<ITableColumn<EntityInfo>> = [
    {
      columnId: 'select',
      headerCellComponent: TableHeaderSelectComponent,
      cellComponent: TableCellSelectComponent,
      class: 'table-column-select',
      cellFlex: '1'
    },
    {
      columnId: 'route',
      headerCell: () => 'Route',
      cellComponent: TableCellRouteComponent,
      sort: true,
      cellFlex: '3'
    },
    {
      columnId: 'tcproute',
      headerCell: () => 'TCP Route',
      cellComponent: TableCellTCPRouteComponent,
      sort: true,
      cellFlex: '3'
    },
    {
      columnId: 'attachedApps',
      headerCell: () => 'Apps Attached',
      cellComponent: TableCellAppRouteComponent,
      sort: true,
      cellFlex: '3'
    },
    {
      columnId: 'edit',
      headerCell: () => 'Actions',
      cellComponent: TableCellActionsComponent,
      class: 'app-table__cell--table-column-edit',
      cellFlex: '1'
    }
  ];

  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.TABLE_ONLY;

  dispatchDeleteAction = route =>
    this.store.dispatch(
      new DeleteRoute(route.entity.guid, this.routesDataSource.cfGuid)
    );

  dispatchUnmapAction = route =>
    this.store.dispatch(
      new UnmapRoute(
        route.entity.guid,
        this.routesDataSource.appGuid,
        this.routesDataSource.cfGuid
      )
    );
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.routesDataSource;
  getFiltersConfigs = () => [];
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private confirmDialog: ConfirmationDialogService,
    private activatedRoute: ActivatedRoute
  ) {
    const spaceGuid = activatedRoute.snapshot.queryParamMap.get('spaceGuid');
    this.routesDataSource = new CfAppRoutesDataSource(
      this.store,
      this.appService,
      new GetSpaceRoutes(spaceGuid, appService.cfGuid),
      getPaginationKey('route', appService.cfGuid, spaceGuid)
    );
  }
}
