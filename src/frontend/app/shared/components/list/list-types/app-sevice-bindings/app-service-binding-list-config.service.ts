import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { IOrganization } from '../../../../../core/cf-api.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { IServiceBinding } from '../../../../../core/cf-api-svc.types';
import { AppServiceBindingDataSource } from './app-service-binding-data-source';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { AppServiceBindingCardComponent } from './app-service-binding-card/app-service-binding-card.component';
@Injectable()
export class AppServiceBindingListConfigService extends BaseCfListConfig<APIResource> {
  dataSource: AppServiceBindingDataSource;
  cardComponent = AppServiceBindingCardComponent;
  getColumns = () => [];

  constructor(private store: Store<AppState>, private appService: ApplicationService) {
    super();
    this.dataSource = new AppServiceBindingDataSource(this.store, appService, this);
  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
