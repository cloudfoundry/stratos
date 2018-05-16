import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { CfOrgSpaceDataService } from '../../../../data-services/cf-org-space-service.service';
import { ListViewTypes } from '../../list.component.types';
import { createListFilterConfig } from '../../list.helper';
import { cfOrgSpaceFilter } from '../app/cf-apps-data-source';
import { CfServiceInstancesListConfigBase } from '../cf-services/cf-service-instances-list-config.base';
import { ServiceInstanceCardComponent } from './service-instance-card/service-instance-card.component';
import { ServiceInstancesWallDataSource } from './service-instances-wall-data-source';


@Injectable()
export class ServiceInstancesWallListConfigService
  extends CfServiceInstancesListConfigBase {

  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no service instances'
  };
  enableTextFilter = true;
  defaultView = 'cards' as ListView;
  cardComponent = ServiceInstanceCardComponent;
  viewType = ListViewTypes.BOTH;

  constructor(store: Store<AppState>,
    datePipe: DatePipe,
    private cfOrgSpaceService: CfOrgSpaceDataService
  ) {
    super(store, datePipe);
    this.getColumns = () => this.serviceInstanceColumns;
    const multiFilterConfigs = [
      createListFilterConfig('cf', 'Cloud Foundry', this.cfOrgSpaceService.cf),
      createListFilterConfig('org', 'Organization', this.cfOrgSpaceService.org),
      createListFilterConfig('space', 'Space', this.cfOrgSpaceService.space),
    ];

    const transformEntities = [{ type: 'filter', field: 'entity.name' }, cfOrgSpaceFilter];
    this.dataSource = new ServiceInstancesWallDataSource(store, transformEntities, this);
    this.getMultiFiltersConfigs = () => multiFilterConfigs;

  }

  getDataSource = () => this.dataSource;

}
