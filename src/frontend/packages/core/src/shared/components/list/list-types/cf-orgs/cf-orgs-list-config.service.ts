import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CfOrgCardComponent } from './cf-org-card/cf-org-card.component';
import { CfOrgsDataSourceService } from './cf-orgs-data-source.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { IOrganization } from '../../../../../core/cf-api.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { ITableColumn } from '../../list-table/table.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';

@Injectable()
export class CfOrgsListConfigService extends BaseCfListConfig<APIResource<IOrganization>> {
  dataSource: CfOrgsDataSourceService;
  cardComponent = CfOrgCardComponent;
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no organizations'
  };
  columns: ITableColumn<APIResource<IOrganization>>[] = [{
    columnId: 'name',
    headerCell: () => 'Name',
    sort: {
      type: 'sort',
      orderKey: 'name',
      field: 'entity.name'
    }
  }, {
    columnId: 'createdAt',
    headerCell: () => 'Creation',
    sort: {
      type: 'sort',
      orderKey: 'createdAt',
      field: 'metadata.created_at'
    },
  }];

  constructor(private store: Store<AppState>, activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfOrgsDataSourceService(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
