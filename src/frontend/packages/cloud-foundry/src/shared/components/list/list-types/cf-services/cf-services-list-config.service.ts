import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { take, filter, map } from 'rxjs/operators';

import { IListConfig, IListMultiFilterConfig, ITableColumn, ITableText, ListViewTypes } from '@stratosui/core';
import { APIResource, connectedEndpointsOfTypesSelector, ListView } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { haveMultiConnectedCfs } from '../../../../../features/cf/cf.helpers';
import { CfOrgSpaceItem, createCfOrgSpaceFilterConfig } from '../../../../data-services/cf-org-space-service.service';
import { CfServiceCardComponent } from './cf-service-card/cf-service-card.component';
import { CfServicesDataSource } from './cf-services-data-source';
import { TableCellServiceActiveComponent } from './table-cell-service-active/table-cell-service-active.component';
import { TableCellServiceBindableComponent } from './table-cell-service-bindable/table-cell-service-bindable.component';
import {
  TableCellServiceBrokerComponent,
  TableCellServiceBrokerComponentMode } from './table-cell-service-broker/table-cell-service-broker.component';
import {
  TableCellServiceCfBreadcrumbsComponent } from './table-cell-service-cf-breadcrumbs/table-cell-service-cf-breadcrumbs.component';
import { TableCellServiceProviderComponent } from './table-cell-service-provider/table-cell-service-provider.component';
import {
  TableCellServiceReferencesComponent } from './table-cell-service-references/table-cell-service-references.component';
import { TableCellServiceTagsComponent } from './table-cell-service-tags/table-cell-service-tags.component';

@Injectable({
  providedIn: 'root'
})
export class CfServicesListConfigService implements IListConfig<APIResource> {
  private store = inject<Store<CFAppState>>(Store);


  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

    this.dataSource = new CfServicesDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
    this.cf = {
      list$: this.store.select(connectedEndpointsOfTypesSelector(CF_ENDPOINT_TYPE)).pipe(
        take(1),
        map(endpoints => Object.values(endpoints))
      ),
      loading$: observableOf(false),
      select: new BehaviorSubject(undefined)
    };
    this.multiFilterConfigs = [
      createCfOrgSpaceFilterConfig('cf', 'Cloud Foundry', this.cf),
    ];

    this.init$ = haveMultiConnectedCfs(this.store).pipe(
      take(1),
      map(multipleConnectedEndpoints => {
        if (!multipleConnectedEndpoints) {
          this.columns = this.columns.filter(column => column.columnId !== CfServicesListConfigService.cfColumnId);
        }
        return true;
      })
    );
  }

  static cfColumnId = 'cf';

  cf!: CfOrgSpaceItem;
  isLocal!: true;
  viewType = ListViewTypes.BOTH;
  enableTextFilter = true;
  dataSource: CfServicesDataSource;
  cardComponent = CfServiceCardComponent;
  defaultView = 'cards' as ListView;
  multiFilterConfigs: IListMultiFilterConfig[] = [];
  text: ITableText = {
    title: null,
    filter: 'Filter by Name and Tags',
    noEntries: 'There are no services',
    maxedResults: {
      icon: 'store',
      canIgnoreMaxFirstLine: 'Fetching all services might take a long time',
      cannotIgnoreMaxFirstLine: 'There are too many services to fetch' }
  };

  columns: ITableColumn<APIResource<any>>[] = [{
    columnId: 'label',
    headerCell: () => 'Name',
    cellDefinition: {
      getValue: (row: APIResource<any>) => row.entity.label,
      getLink: (service: APIResource<any>) => `/marketplace/${service.entity.cfGuid}/${service.metadata.guid}`
    },
    sort: {
      type: 'natural-sort',
      orderKey: 'label',
      field: 'entity.label'
    },
    cellFlex: '2'
  }, {
    columnId: 'description',
    headerCell: () => 'Description',
    cellDefinition: {
      getValue: (row: APIResource<any>) => row.entity.description },
    cellFlex: '3'
  }, {
    columnId: 'broker',
    headerCell: () => 'Broker',
    cellComponent: TableCellServiceBrokerComponent,
    cellConfig: {
      mode: TableCellServiceBrokerComponentMode.NAME
    },
    cellFlex: '2'
  }, {
    columnId: 'brokerScope',
    headerCell: () => 'Scope',
    cellComponent: TableCellServiceBrokerComponent,
    cellConfig: {
      mode: TableCellServiceBrokerComponentMode.SCOPE
    },
    cellFlex: '2'
  }, {
    columnId: 'plans',
    headerCell: () => 'Plans',
    cellDefinition: {
      getValue: (service: APIResource<any>) => service.entity.service_plans.length
    },
    cellFlex: '1'
  }, {
    columnId: 'active',
    headerCell: () => 'Active',
    cellComponent: TableCellServiceActiveComponent,
    sort: {
      type: 'sort',
      orderKey: 'active',
      field: 'entity.active'
    },
    cellFlex: '1'
  }, {
    columnId: 'bindable',
    headerCell: () => 'Bindable',
    cellComponent: TableCellServiceBindableComponent,
    sort: {
      type: 'sort',
      orderKey: 'bindable',
      field: 'entity.bindable'
    },
    cellFlex: '1'
  }, {
    columnId: 'references',
    headerCell: () => 'References',
    cellComponent: TableCellServiceReferencesComponent,
    cellFlex: '1'
  }, {
    columnId: 'provider',
    headerCell: () => 'Provider',
    cellComponent: TableCellServiceProviderComponent,
    cellFlex: '1'
  }, {
    columnId: CfServicesListConfigService.cfColumnId,
    headerCell: () => 'CF Endpoint',
    cellComponent: TableCellServiceCfBreadcrumbsComponent,
    cellFlex: '1'
  }, {
    columnId: 'tags',
    headerCell: () => 'Tags',
    cellComponent: TableCellServiceTagsComponent,
    cellFlex: '2'
  }];
  private init$: Observable<boolean>;

  getColumns = (): ITableColumn<APIResource<any>>[] => this.columns;
  getGlobalActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IGlobalListAction<APIResource<any>>[] => [];
  getMultiActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IMultiListAction<APIResource<any>>[] => [];
  getSingleActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IListAction<APIResource<any>>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => this.multiFilterConfigs;
  getDataSource = (): CfServicesDataSource => this.dataSource;
  getInitialised = (): Observable<boolean> => this.init$;
}
