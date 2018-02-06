import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, take, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ApplicationService } from '../../features/applications/application.service';
import { AssociateRouteWithAppApplication } from '../../store/actions/application.actions';
import { getPaginationKey } from '../../store/actions/pagination.actions';
import { DeleteRoute, GetSpaceRoutes, UnmapRoute } from '../../store/actions/route.actions';
import { RouterNav } from '../../store/actions/router.actions';
import { AppState } from '../../store/app-state';
import { EntityInfo } from '../../store/types/api.types';
import { ConfirmationDialogService } from '../components/confirmation-dialog.service';
import { IMultiListAction, ListViewTypes } from '../components/list/list.component';
import {
  TableCellAppRouteComponent,
} from '../components/table/custom-cells/table-cell-app-route/table-cell-app-route.component';
import { TableCellRadioComponent } from '../components/table/custom-cells/table-cell-radio/table-cell-radio.component';
import { TableCellRouteComponent } from '../components/table/custom-cells/table-cell-route/table-cell-route.component';
import {
  TableCellTCPRouteComponent,
} from '../components/table/custom-cells/table-cell-tcproute/table-cell-tcproute.component';
import { ITableColumn } from '../components/table/table.types';
import { CfAppRoutesDataSource } from '../data-sources/cf-app-routes-data-source';

@Injectable()
export class CfAppMapRoutesListConfigService {
  appSubscription: Subscription;
  isLocal?: boolean;
  routesDataSource: CfAppRoutesDataSource;

  private listMapRoute: IMultiListAction<EntityInfo> = {
    action: (row: EntityInfo[]) => {
      const rowEntity = row[0].entity;
      this.store.dispatch(
        new AssociateRouteWithAppApplication(
          this.routesDataSource.appGuid,
          rowEntity.guid,
          this.routesDataSource.cfGuid
        )
      );
      this.appService.app$
        .pipe(
          map(p => p.entityRequestInfo.updating['Assigning-Route']),
          filter(p => !p.busy),
          take(1),
          tap(p => {
            if (p.error) {
              const message = `Failed to associate route with the app! \nReason: ${
                p.error
              }`;
              this.snackBar.open(message, 'Dismiss');
            } else {
              this.store.dispatch(
                new RouterNav({
                  path: [
                    'applications',
                    this.routesDataSource.cfGuid,
                    this.routesDataSource.appGuid
                  ]
                })
              );
            }
          })
        )
        .subscribe();
    },
    icon: 'link',
    label: 'Map',
    description: 'Map route',
    visible: (row: EntityInfo) => true,
    enabled: (row: EntityInfo) => true
  };

  columns: Array<ITableColumn<EntityInfo>> = [
    {
      columnId: 'select',
      headerCell: () => '',
      cellComponent: TableCellRadioComponent,
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
    }
  ];

  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.TABLE_ONLY;

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
  getMultiActions = () => [this.listMapRoute];
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
      true
    );
  }
}
