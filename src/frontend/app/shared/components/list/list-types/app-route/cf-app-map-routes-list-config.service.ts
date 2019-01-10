import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { ApplicationService } from '../../../../../features/applications/application.service';
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
} from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { TableCellRadioComponent } from '../../list-table/table-cell-radio/table-cell-radio.component';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { CfAppRoutesDataSource } from './cf-app-routes-data-source';
import { TableCellAppRouteComponent } from './table-cell-app-route/table-cell-app-route.component';
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
      cellConfig: {
        isDisabled: (row): boolean => {
          return row && row.entity && row.entity.apps && row.entity.apps.find(
            a => a.metadata.guid === this.appService.appGuid
          );
        }
      },
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

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.routesDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    activatedRoute: ActivatedRoute,
  ) {
    const spaceGuid = activatedRoute.snapshot.queryParamMap.get('spaceGuid');
    const action = new GetSpaceRoutes(spaceGuid, appService.cfGuid, createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid), [
      createEntityRelationKey(routeSchemaKey, domainSchemaKey),
      createEntityRelationKey(routeSchemaKey, applicationSchemaKey)
    ]);
    action.initialParams['order-direction-field'] = 'route';
    this.routesDataSource = new CfAppRoutesDataSource(
      this.store,
      this.appService,
      action,
      this
    );
  }
}
