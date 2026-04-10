import { DatePipe } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { CFAppState } from '../../../../../cf-app-state';
import { getCFEntityKey } from '../../../../../cf-entity-helpers';
import { serviceInstancesEntityType, userProvidedServiceInstanceEntityType } from '../../../../../cf-entity-types';
import { cfOrgSpaceFilter } from '../../../../../features/cf/cf.helpers';
import { CfOrgSpaceDataService, createCfOrgSpaceFilterConfig } from '../../../../data-services/cf-org-space-service.service';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import {
  CurrentUserPermissionsService,
  CardMultiActionComponents,
  ITableText,
  defaultPaginationPageSizeOptionsCards,
  ListViewTypes,
} from '@stratosui/core';
import { ListView } from '@stratosui/store';
import { CfServiceInstancesListConfigBase } from '../cf-services/cf-service-instances-list-config.base';
import { ServiceInstanceCardComponent } from './service-instance-card/service-instance-card.component';
import { ServiceInstancesWallDataSource } from './service-instances-wall-data-source';
import {
  UserProvidedServiceInstanceCardComponent,
} from './user-provided-service-instance-card/user-provided-service-instance-card.component';

/**
 * Service instance list shown for `services` nav component
 *
 * @export
 * @extends {CfServiceInstancesListConfigBase}
 */
@Injectable({
  providedIn: 'root'
})
export class ServiceInstancesWallListConfigService extends CfServiceInstancesListConfigBase {
  endpointType = 'cf';
  text: ITableText = {
    title: null,
    filter: 'Filter by Name',
    noEntries: 'There are no service instances',
    maxedResults: {
      icon: 'service',
      iconFont: 'stratos-icons',
      canIgnoreMaxFirstLine: 'Fetching all service instances might take a long time',
      cannotIgnoreMaxFirstLine: 'There are too many service instances to fetch',
      filterLine: 'Please use the Cloud Foundry, Organization or Space filters'
    }
  };
  enableTextFilter = true;
  defaultView = 'cards' as ListView;
  cardComponent = new CardMultiActionComponents({
    [getCFEntityKey(serviceInstancesEntityType)]: ServiceInstanceCardComponent,
    [getCFEntityKey(userProvidedServiceInstanceEntityType)]: UserProvidedServiceInstanceCardComponent
  });
  viewType = ListViewTypes.BOTH;
  pageSizeOptions = defaultPaginationPageSizeOptionsCards;
  getInitialised: () => Observable<boolean>;
  private cfOrgSpaceService = inject(CfOrgSpaceDataService);

  constructor() {
    const store = inject(Store<CFAppState>);
    const datePipe = inject(DatePipe);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);
    const serviceActionHelperService = inject(ServiceActionHelperService);

    super(
      `/services`
    );
    const multiFilterConfigs = [
      createCfOrgSpaceFilterConfig('cf', 'Cloud Foundry', this.cfOrgSpaceService.cf),
      createCfOrgSpaceFilterConfig('org', 'Organization', this.cfOrgSpaceService.org),
      createCfOrgSpaceFilterConfig('space', 'Space', this.cfOrgSpaceService.space),
    ];

    const transformEntities = [{ type: 'filter', field: 'entity.name' }, cfOrgSpaceFilter];
    this.dataSource = new ServiceInstancesWallDataSource(store, transformEntities, this);
    this.getMultiFiltersConfigs = () => multiFilterConfigs;

    this.serviceInstanceColumns.find(column => column.columnId === 'attachedApps').cellConfig = {
      breadcrumbs: 'service-wall'
    };

    this.cfOrgSpaceService.setInitialValuesFromAction(this.dataSource.masterAction, 'cf', 'org', 'space');
    this.getInitialised = () => combineLatest(
      this.cfOrgSpaceService.cf.list$,
      this.cfOrgSpaceService.org.list$,
      this.cfOrgSpaceService.space.list$,
    ).pipe(
      map(loading => !loading),
      startWith(true)
    );
  }

  getDataSource = () => this.dataSource;

}
