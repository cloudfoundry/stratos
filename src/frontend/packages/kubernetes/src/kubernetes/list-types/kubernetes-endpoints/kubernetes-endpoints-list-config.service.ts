import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import {
  BaseEndpointsDataSource,
} from '../../../../../core/src/shared/components/list/list-types/endpoint/base-endpoints-data-source';
import {
  EndpointCardComponent,
} from '../../../../../core/src/shared/components/list/list-types/endpoint/endpoint-card/endpoint-card.component';
import {
  EndpointsListConfigService,
} from '../../../../../core/src/shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { IListConfig, ListViewTypes, IGlobalListAction, IMultiListAction, IListAction, IListMultiFilterConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { AppState, EndpointModel } from '../../../../../store/src/public-api';
import { KubernetesEndpointsDataSource } from './kubernetes-endpoints-data-source';

@Injectable({
  providedIn: 'root'
})
export class KubernetesEndpointsListConfigService implements IListConfig<EndpointModel> {
  private store = inject<Store<AppState>>(Store);

  columns: ITableColumn<EndpointModel>[];
  isLocal = true;
  dataSource: BaseEndpointsDataSource;
  viewType = ListViewTypes.CARD_ONLY;
  cardComponent = EndpointCardComponent;
  text = {
    title: '',
    filter: 'Filter Endpoints',
    noEntries: 'There are no endpoints'
  };
  enableTextFilter = true;


  constructor() {
    const paginationMonitorFactory = inject(PaginationMonitorFactory);
    const entityMonitorFactory = inject(EntityMonitorFactory);
    const internalEventMonitorFactory = inject(InternalEventMonitorFactory);
    const endpointsListConfigService = inject(EndpointsListConfigService);

    this.columns = endpointsListConfigService.columns.filter(column => {
      return column.columnId !== 'type';
    });
    this.dataSource = new KubernetesEndpointsDataSource(
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
  public getDataSource = (): KubernetesEndpointsDataSource => this.dataSource;
}
