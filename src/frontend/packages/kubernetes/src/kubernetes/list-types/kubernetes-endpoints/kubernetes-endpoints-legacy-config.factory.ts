import { Injector } from '@angular/core';
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
import {
  IGlobalListAction,
  IListAction,
  IListConfig,
  IListMultiFilterConfig,
  IMultiListAction,
  ListViewTypes,
} from '../../../../../core/src/shared/components/list/list.component.types';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { AppState, EndpointModel } from '../../../../../store/src/public-api';
import { KubernetesEndpointsDataSource } from './kubernetes-endpoints-data-source';

// Legacy `IListConfig<EndpointModel>` factory for the K8s endpoints page.
//
// This file is the deliberate residual ngrx surface for K-endpoints
// (wave-3): the `BaseEndpointsDataSource` and `EndpointCardComponent`
// still consume `Store<AppState>` and pagination monitors, so we keep
// the legacy IListConfig wiring in one focused place. The page-level
// signal-config (`kubernetes-endpoints-signal-config.service.ts`) wraps
// the result via `adaptLegacyListConfig` so neither it nor the host
// `KubernetesComponent` import `@ngrx/store` directly.
//
// Replaces the previous `KubernetesEndpointsListConfigService` injectable.
// Returned as a plain function rather than a service so it can't accidentally
// be re-introduced as a `ListConfig` provider on a host component.

export function buildKubernetesEndpointsListConfig(
  injector: Injector,
): IListConfig<EndpointModel> {
  const store = injector.get<Store<AppState>>(Store);
  const paginationMonitorFactory = injector.get(PaginationMonitorFactory);
  const entityMonitorFactory = injector.get(EntityMonitorFactory);
  const internalEventMonitorFactory = injector.get(InternalEventMonitorFactory);
  const endpointsListConfigService = injector.get(EndpointsListConfigService);

  // Drop the 'type' column — every row is a kubernetes endpoint, so the
  // type column is dead weight. Mirrors the original service's filter.
  const columns: ITableColumn<EndpointModel>[] = endpointsListConfigService.columns.filter(
    column => column.columnId !== 'type',
  );

  let dataSource: BaseEndpointsDataSource;

  // `isLocal` from the original service is intentionally dropped — it
  // wasn't part of `IListConfig` (it lived on the abstract `ListConfig`
  // class) and the adapter doesn't read it. The `BaseEndpointsDataSource`
  // ctor still wires up local pagination via its own internal flag.
  const config: IListConfig<EndpointModel> = {
    viewType: ListViewTypes.CARD_ONLY,
    cardComponent: EndpointCardComponent,
    text: {
      title: '',
      filter: 'Filter Endpoints',
      noEntries: 'There are no endpoints',
    },
    enableTextFilter: true,
    getColumns: (): ITableColumn<EndpointModel>[] => columns,
    getGlobalActions: (): IGlobalListAction<EndpointModel>[] => [],
    getMultiActions: (): IMultiListAction<EndpointModel>[] => [],
    getSingleActions: (): IListAction<EndpointModel>[] => [],
    getMultiFiltersConfigs: (): IListMultiFilterConfig[] => [],
    getDataSource: (): KubernetesEndpointsDataSource => dataSource,
  };

  dataSource = new KubernetesEndpointsDataSource(
    store,
    config,
    paginationMonitorFactory,
    entityMonitorFactory,
    internalEventMonitorFactory,
  );

  return config;
}
