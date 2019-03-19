import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src/app-state';
import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import {
  BaseEndpointsDataSource,
} from '../../../../shared/components/list/list-types/cf-endpoints/base-endpoints-data-source';
import {
  EndpointCardComponent,
} from '../../../../shared/components/list/list-types/endpoint/endpoint-card/endpoint-card.component';
import { endpointColumns } from '../../../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { IListConfig, ListViewTypes } from '../../../../shared/components/list/list.component.types';

@Injectable()
export class KubernetesEndpointsListConfigService implements IListConfig<EndpointModel> {
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
  tableFixedRowHeight = true;


  constructor(
    private store: Store<AppState>,
  ) {
    this.columns = endpointColumns.filter(column => {
      return column.columnId !== 'type';
    });
    this.dataSource = new BaseEndpointsDataSource(this.store, this, 'k8s');
  }
  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
}
