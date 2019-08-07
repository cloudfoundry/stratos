import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { UserFavoriteEndpoint } from '../../../../../../../store/src/types/user-favorites.types';
import { getFullEndpointApiUrl, getNameForEndpointType } from '../../../../../features/endpoints/endpoint-helpers';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { createTableColumnFavorite } from '../../list-table/table-cell-favorite/table-cell-favorite.component';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, ListViewTypes } from '../../list.component.types';
import { EndpointCardComponent } from './endpoint-card/endpoint-card.component';
import { EndpointListHelper } from './endpoint-list.helpers';
import { EndpointsDataSource } from './endpoints-data-source';
import { TableCellEndpointDetailsComponent } from './table-cell-endpoint-details/table-cell-endpoint-details.component';
import { TableCellEndpointNameComponent } from './table-cell-endpoint-name/table-cell-endpoint-name.component';
import { TableCellEndpointStatusComponent } from './table-cell-endpoint-status/table-cell-endpoint-status.component';

function getEndpointTypeString(endpoint: EndpointModel): string {
  return getNameForEndpointType(endpoint.cnsi_type, endpoint.sub_type);
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
      field: 'user'
    },
    cellFlex: '1',
    cellConfig: {
      showLabel: false
    }
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
  {
    columnId: 'details',
    headerCell: () => 'Details',
    cellComponent: TableCellEndpointDetailsComponent,
    cellFlex: '4'
  }
];

@Injectable()
export class EndpointsListConfigService implements IListConfig<EndpointModel> {
  cardComponent = EndpointCardComponent;

  private singleActions: IListAction<EndpointModel>[];

  private globalActions = [];

  columns = [
    ...endpointColumns
  ];
  isLocal = true;
  dataSource: EndpointsDataSource;
  viewType = ListViewTypes.BOTH;
  defaultView = 'cards' as ListView;
  text = {
    title: '',
    filter: 'Filter Endpoints'
  };
  enableTextFilter = true;
  tableFixedRowHeight = true;

  constructor(
    private store: Store<AppState>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
    endpointListHelper: EndpointListHelper
  ) {
    this.singleActions = endpointListHelper.endpointActions();
    const favoriteCell = createTableColumnFavorite(
      (row: EndpointModel) => new UserFavoriteEndpoint(
        row
      )
    );
    this.columns.push(favoriteCell);
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
  public getFilters = () => [];
  public setFilter = (id: string) => null;
}
