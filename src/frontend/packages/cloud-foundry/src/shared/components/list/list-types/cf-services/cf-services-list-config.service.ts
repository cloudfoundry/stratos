import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, type Observable, of as observableOf } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { type IListConfig, type IListMultiFilterConfig, type ITableColumn, type ITableText, ListViewTypes } from '@stratosui/core';
import { type APIResource, connectedEndpointsOfTypesSelector, type ListView, type GeneralEntityAppState } from '@stratosui/store';
import type { CFAppState } from '../../../../../cf-app-state';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import type { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { haveMultiConnectedCfs } from '../../../../../features/cf/cf.helpers';
import { type CfOrgSpaceItem, createCfOrgSpaceFilterConfig } from '../../../../data-services/cf-org-space-service.service';
import type { IService } from '../../../../../cf-api-svc.types';
import { CfServiceCardComponent } from './cf-service-card/cf-service-card.component';
import { CfServicesDataSource } from './cf-services-data-source';
import { TableCellServiceActiveComponent } from './table-cell-service-active/table-cell-service-active.component';
import { TableCellServiceBindableComponent } from './table-cell-service-bindable/table-cell-service-bindable.component';
import {
  TableCellServiceBrokerComponent,
  TableCellServiceBrokerComponentMode,
} from './table-cell-service-broker/table-cell-service-broker.component';
import {
  TableCellServiceCfBreadcrumbsComponent,
} from './table-cell-service-cf-breadcrumbs/table-cell-service-cf-breadcrumbs.component';
import { TableCellServiceProviderComponent } from './table-cell-service-provider/table-cell-service-provider.component';
import {
  TableCellServiceReferencesComponent,
} from './table-cell-service-references/table-cell-service-references.component';
import { TableCellServiceTagsComponent } from './table-cell-service-tags/table-cell-service-tags.component';

@Injectable({
  providedIn: 'root'
})
export class CfServicesListConfigService implements IListConfig<APIResource<IService>> {

  constructor(
    private store: Store<GeneralEntityAppState>,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    this.dataSource = new CfServicesDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
    this.cf = {
      list$: this.store.select(connectedEndpointsOfTypesSelector(CF_ENDPOINT_TYPE)).pipe(
        first(),
        map(endpoints => Object.values(endpoints))
      ),
      loading$: observableOf(false),
      select: new BehaviorSubject(undefined)
    };
    this.multiFilterConfigs = [
      createCfOrgSpaceFilterConfig('cf', 'Cloud Foundry', this.cf),
    ];

    this.init$ = haveMultiConnectedCfs(this.store).pipe(
      first(),
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
    filter: 'Search by name and tags',
    noEntries: 'There are no services',
    maxedResults: {
      icon: 'store',
      canIgnoreMaxFirstLine: 'Fetching all services might take a long time',
      cannotIgnoreMaxFirstLine: 'There are too many services to fetch',
    }
  };

  columns: ITableColumn<APIResource<IService>>[] = [{
    columnId: 'label',
    headerCell: () => 'Name',
    cellDefinition: {
      valuePath: 'entity.label',
      getLink: (service: APIResource<IService>) => `/marketplace/${service.entity.cfGuid}/${service.metadata.guid}`
    },
    sort: {
      type: 'sort',
      orderKey: 'label',
      field: 'entity.label'
    },
    cellFlex: '2'
  }, {
    columnId: 'description',
    headerCell: () => 'Description',
    cellDefinition: {
      valuePath: 'entity.description',
    },
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
      getValue: (service: APIResource<IService>) => service.entity.service_plans.length as any
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

  getColumns = (): ITableColumn<APIResource<IService>>[] => this.columns;
  getGlobalActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IGlobalListAction<APIResource<IService>>[] => [];
  getMultiActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IMultiListAction<APIResource<IService>>[] => [];
  getSingleActions = (): import('../../../../../../../core/src/shared/components/list/list.component.types').IListAction<APIResource<IService>>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => this.multiFilterConfigs;
  getDataSource = (): any => this.dataSource as any;
  getInitialised = (): Observable<boolean> => this.init$;
}
