import { Injectable, inject } from '@angular/core';
import { Store } from '@stratosui/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  EndpointCardComponent,
} from '../../../../../../../core/src/shared/components/list/list-types/endpoint/endpoint-card/endpoint-card.component';
import {
  EndpointsListConfigService,
} from '../../../../../../../core/src/shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { IGlobalListAction, IListAction, IListConfig, IListMultiFilterConfig, IMultiListAction, ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { CFEndpointsDataSource } from './cf-endpoints-data-source';


@Injectable({
  providedIn: 'root'
})
export class CFEndpointsListConfigService implements IListConfig<EndpointModel> {
  private store = inject<Store<CFAppState>>(Store);

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

  constructor() {
    const paginationMonitorFactory = inject(PaginationMonitorFactory);
    const entityMonitorFactory = inject(EntityMonitorFactory);
    const internalEventMonitorFactory = inject(InternalEventMonitorFactory);
    const endpointsListConfigService = inject(EndpointsListConfigService);

    this.columns = endpointsListConfigService.columns.filter((column: any) => {
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
  public getDataSource = (): CFEndpointsDataSource => this.dataSource;
}
