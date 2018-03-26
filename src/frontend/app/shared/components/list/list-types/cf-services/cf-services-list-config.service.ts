import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { EndpointsService } from '../../../../../core/endpoints.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { endpointsRegisteredEntitiesSelector } from '../../../../../store/selectors/endpoint.selectors';
import { APIResource } from '../../../../../store/types/api.types';
import { CfOrgSpaceItem } from '../../../../data-services/cf-org-space-service.service';
import { IListConfig, IListMultiFilterConfig, ListViewTypes } from '../../list.component.types';
import { createListFilterConfig } from '../../list.helper';
import { CfServiceCardComponent } from './cf-service-card/cf-service-card.component';
import { CfServicesDataSource } from './cf-services-data-source';

@Injectable()
export class CfServicesListConfigService implements IListConfig<APIResource> {
  cf: CfOrgSpaceItem;
  isLocal?: boolean;
  viewType = ListViewTypes.CARD_ONLY;
  enableTextFilter = false;
  tableFixedRowHeight?: boolean;
  dataSource: CfServicesDataSource;
  pageSizeOptions = [9, 45, 90];
  cardComponent = CfServiceCardComponent;
  defaultView = 'cards' as ListView;
  multiFilterConfigs: IListMultiFilterConfig[] = [];
  text = {
    title: null,
    noEntries: 'There are no services'
  };

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private endpointsService: EndpointsService
  ) {
    this.dataSource = new CfServicesDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
    this.cf = {
      list$: this.store
        .select(endpointsRegisteredEntitiesSelector)
        .first()
        .map(endpoints => Object.values(endpoints)),
      loading$: Observable.of(false),
      select: new BehaviorSubject(undefined)
    };

    this.multiFilterConfigs = [
      createListFilterConfig('cf', 'Cloud Foundry', this.cf),
    ];

  }

  getColumns = () => [];
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => this.multiFilterConfigs;
  getDataSource = () => this.dataSource;
}
