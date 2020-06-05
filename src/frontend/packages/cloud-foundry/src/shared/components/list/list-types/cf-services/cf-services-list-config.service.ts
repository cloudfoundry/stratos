import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ITableColumn, ITableText } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  IListConfig,
  IListMultiFilterConfig,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { connectedEndpointsOfTypesSelector } from '../../../../../../../store/src/selectors/endpoint.selectors';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { haveMultiConnectedCfs } from '../../../../../features/cloud-foundry/cf.helpers';
import { CfOrgSpaceItem, createCfOrgSpaceFilterConfig } from '../../../../data-services/cf-org-space-service.service';
import { CfServiceCardComponent } from './cf-service-card/cf-service-card.component';
import { CfServicesDataSource } from './cf-services-data-source';
import { TableCellServiceActiveComponent } from './table-cell-service-active/table-cell-service-active.component';
import { TableCellServiceBindableComponent } from './table-cell-service-bindable/table-cell-service-bindable.component';
import {
  TableCellServiceCfBreadcrumbsComponent,
} from './table-cell-service-cf-breadcrumbs/table-cell-service-cf-breadcrumbs.component';
import { TableCellServiceProviderComponent } from './table-cell-service-provider/table-cell-service-provider.component';
import {
  TableCellServiceReferencesComponent,
} from './table-cell-service-references/table-cell-service-references.component';
import { TableCellServiceTagsComponent } from './table-cell-service-tags/table-cell-service-tags.component';

@Injectable()
export class CfServicesListConfigService implements IListConfig<APIResource> {

  constructor(
    private store: Store<CFAppState>,
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

  cf: CfOrgSpaceItem;
  isLocal: true;
  viewType = ListViewTypes.BOTH;
  enableTextFilter = true;
  dataSource: CfServicesDataSource;
  cardComponent = CfServiceCardComponent;
  defaultView = 'cards' as ListView;
  multiFilterConfigs: IListMultiFilterConfig[] = [];
  text: ITableText = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no services',
    maxedResults: {
      icon: 'store',
      canIgnoreMaxFirstLine: 'Fetching all services might take a long time',
      cannotIgnoreMaxFirstLine: 'There are too many services to fetch',
    }
  };

  columns: ITableColumn<APIResource>[] = [{
    columnId: 'label',
    headerCell: () => 'Name',
    cellDefinition: {
      valuePath: 'entity.label',
      getLink: service => `/marketplace/${service.entity.cfGuid}/${service.metadata.guid}`
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
    cellDefinition: {
      valuePath: 'entity.label',
    },
    cellFlex: '1'
  }, {
    columnId: 'plans',
    headerCell: () => 'Plans',
    cellDefinition: {
      getValue: service => service.entity.service_plans.length
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

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => this.multiFilterConfigs;
  getDataSource = () => this.dataSource;
  getInitialised = () => this.init$;
}
