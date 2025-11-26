import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  type ITableColumn,
  EndpointCardComponent,
  type EndpointsListConfigService,
  type IGlobalListAction,
  type IListAction,
  type IListConfig,
  type IListDataSource,
  type IListMultiFilterConfig,
  type IMultiListAction,
  ListViewTypes,
} from '@stratosui/core';
import type { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import type { InternalEventMonitorFactory } from '../../../../../../../store/src/monitors/internal-event-monitor.factory';
import type { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import type { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import type { GeneralEntityAppState } from '@stratosui/store';
import { CFEndpointsDataSource } from './cf-endpoints-data-source';


@Injectable({
  providedIn: 'root'
})
export class CFEndpointsListConfigService implements IListConfig<EndpointModel> {
  columns: ITableColumn<EndpointModel>[];
  isLocal = true;
  dataSource: CFEndpointsDataSource;
  viewType = ListViewTypes.CARD_ONLY;
  cardComponent = EndpointCardComponent;
  text = {
    title: '',
    filter: 'Filter Endpoints',
    noEntries: 'There are no endpoints'
  };
  enableTextFilter = true;

  constructor(
    private store: Store<GeneralEntityAppState>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
    endpointsListConfigService: EndpointsListConfigService,
  ) {
    this.columns = endpointsListConfigService.columns.filter((column: ITableColumn<EndpointModel>) => {
      return column.columnId !== 'type';
    });
    this.dataSource = new CFEndpointsDataSource(
      this.store,
      this,
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory,
    );
  }
  public getColumns = (): ITableColumn<EndpointModel>[] => this.columns;
  public getGlobalActions = (): IGlobalListAction<EndpointModel>[] => [];
  public getMultiActions = (): IMultiListAction<EndpointModel>[] => [];
  public getSingleActions = (): IListAction<EndpointModel>[] => [];
  public getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  public getDataSource = (): IListDataSource<EndpointModel> => this.dataSource as IListDataSource<EndpointModel>;
}
