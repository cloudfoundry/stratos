import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { getCFEntityKey } from '../../../../../../../cloud-foundry/src/cf-entity-helpers';
import {
  serviceInstancesEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import {
  CardMultiActionComponents,
} from '../../../../../../../core/src/shared/components/list/list-cards/card.component.types';
import { ITableText } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  defaultPaginationPageSizeOptionsCards,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { cfOrgSpaceFilter } from '../../../../../features/cloud-foundry/cf.helpers';
import { CfOrgSpaceDataService, createCfOrgSpaceFilterConfig } from '../../../../data-services/cf-org-space-service.service';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
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
@Injectable()
export class ServiceInstancesWallListConfigService extends CfServiceInstancesListConfigBase {
  endpointType = 'cf';
  text: ITableText = {
    title: null,
    filter: 'Search by name',
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

  constructor(
    store: Store<CFAppState>,
    datePipe: DatePipe,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    currentUserPermissionsService: CurrentUserPermissionsService,
    serviceActionHelperService: ServiceActionHelperService
  ) {
    super(
      store,
      datePipe,
      currentUserPermissionsService,
      serviceActionHelperService,
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

    this.getInitialised = () => combineLatest(
      cfOrgSpaceService.cf.list$,
      cfOrgSpaceService.org.list$,
      cfOrgSpaceService.space.list$,
    ).pipe(
      map(loading => !loading),
      startWith(true)
    );
  }

  getDataSource = () => this.dataSource;

}
