import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';

import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog';
import { FavoritesConfigMapper } from '../../../../../../../store/src/favorite-config-mapper';
import { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { createTableColumnFavorite } from '../../list-table/table-cell-favorite/table-cell-favorite.component';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, ListViewTypes } from '../../list.component.types';
import { EndpointCardComponent } from './endpoint-card/endpoint-card.component';
import { EndpointListHelper } from './endpoint-list.helpers';
import { EndpointsDataSource } from './endpoints-data-source';
import { TableCellEndpointAddressComponent } from './table-cell-endpoint-address/table-cell-endpoint-address.component';
import { TableCellEndpointDetailsComponent } from './table-cell-endpoint-details/table-cell-endpoint-details.component';
import { TableCellEndpointNameComponent } from './table-cell-endpoint-name/table-cell-endpoint-name.component';
import { TableCellEndpointStatusComponent } from './table-cell-endpoint-status/table-cell-endpoint-status.component';



@Injectable()
export class EndpointsListConfigService implements IListConfig<EndpointModel> {
  cardComponent = EndpointCardComponent;

  private singleActions: IListAction<EndpointModel>[];

  public readonly columns: ITableColumn<EndpointModel>[] = [
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
        getValue: this.getEndpointTypeString
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
      cellComponent: TableCellEndpointAddressComponent,
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

  isLocal = true;
  dataSource: EndpointsDataSource;
  viewType = ListViewTypes.BOTH;
  defaultView = 'cards' as ListView;
  text = {
    title: '',
    filter: 'Filter Endpoints'
  };
  enableTextFilter = true;

  constructor(
    private store: Store<AppState>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
    endpointListHelper: EndpointListHelper,
    favoritesConfigMapper: FavoritesConfigMapper,
  ) {
    this.singleActions = endpointListHelper.endpointActions();
    const favoriteCell = createTableColumnFavorite(
      (row: EndpointModel) => favoritesConfigMapper.getFavoriteEndpointFromEntity(row)
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

  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => this.singleActions;
  public getColumns = () => this.columns;
  public getDataSource = () => this.dataSource;
  public getMultiFiltersConfigs = () => [];

  private getEndpointTypeString(endpoint: EndpointModel): string {
    return entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition.label;
  }
}
