import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { CfOrgCardComponent } from './cf-org-card/cf-org-card.component';
import { CfOrgsDataSourceService } from './cf-orgs-data-source.service';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { IOrganization } from '../../../../../core/cf-api.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';

@Injectable()
export class CfOrgsListConfigService extends BaseCfListConfig<APIResource<IOrganization>> {
  dataSource: CfOrgsDataSourceService;
  cardComponent = CfOrgCardComponent;
  text = {
    title: null,
    noEntries: 'There are no organizations'
  };

  constructor(private store: Store<AppState>, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfOrgsDataSourceService(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }

  getColumns = () => [];
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
