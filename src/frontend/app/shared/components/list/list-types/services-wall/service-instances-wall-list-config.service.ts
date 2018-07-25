import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { CfOrgSpaceDataService } from '../../../../data-services/cf-org-space-service.service';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { defaultPaginationPageSizeOptionsCards, ListViewTypes } from '../../list.component.types';
import { createListFilterConfig } from '../../list.helper';
import { cfOrgSpaceFilter } from '../app/cf-apps-data-source';
import { CfServiceInstancesListConfigBase } from '../cf-services/cf-service-instances-list-config.base';
import { ServiceInstanceCardComponent } from './service-instance-card/service-instance-card.component';
import { ServiceInstancesWallDataSource } from './service-instances-wall-data-source';

/**
 * Service instance list shown for `services` nav component
 *
 * @export
 * @class ServiceInstancesWallListConfigService
 * @extends {CfServiceInstancesListConfigBase}
 */
@Injectable()
export class ServiceInstancesWallListConfigService extends CfServiceInstancesListConfigBase {

  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no service instances'
  };
  enableTextFilter = true;
  defaultView = 'cards' as ListView;
  cardComponent = ServiceInstanceCardComponent;
  viewType = ListViewTypes.BOTH;
  pageSizeOptions = defaultPaginationPageSizeOptionsCards;

  constructor(store: Store<AppState>,
    datePipe: DatePipe,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    currentUserPermissionsService: CurrentUserPermissionsService,
    serviceActionHelperService: ServiceActionHelperService
  ) {
    super(store, datePipe, currentUserPermissionsService, serviceActionHelperService);
    const multiFilterConfigs = [
      createListFilterConfig('cf', 'Cloud Foundry', this.cfOrgSpaceService.cf),
      createListFilterConfig('org', 'Organization', this.cfOrgSpaceService.org),
      createListFilterConfig('space', 'Space', this.cfOrgSpaceService.space),
    ];

    const transformEntities = [{ type: 'filter', field: 'entity.name' }, cfOrgSpaceFilter];
    this.dataSource = new ServiceInstancesWallDataSource(store, transformEntities, this);
    this.getMultiFiltersConfigs = () => multiFilterConfigs;

    this.serviceInstanceColumns.find(column => column.columnId === 'attachedApps').cellConfig = {
      breadcrumbs: 'service-wall'
    };
  }

  getDataSource = () => this.dataSource;

}
