import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { AppState } from '../../../../../store/app-state';
import { CfServiceInstancesListConfigBase } from '../cf-services/cf-service-instances-list-config.base';
import { ServiceInstancesDataSource } from './service-instances-data-source';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';

/**
 * Service instance list shown for `service / service instances` component
 *
 * @export
 * @class ServiceInstancesListConfigService
 * @extends {CfServiceInstancesListConfigBase}
 */
@Injectable()
export class ServiceInstancesListConfigService extends CfServiceInstancesListConfigBase {

  constructor(
    store: Store<AppState>,
    servicesService: ServicesService,
    datePipe: DatePipe,
    currentUserPermissionsService: CurrentUserPermissionsService) {
    super(store, datePipe, currentUserPermissionsService);
    // Remove 'Service' column
    this.serviceInstanceColumns.splice(1, 1);
    this.dataSource = new ServiceInstancesDataSource(servicesService.cfGuid, servicesService.serviceGuid, store, this);
    this.serviceInstanceColumns.find(column => column.columnId === 'attachedApps').cellConfig = {
      breadcrumbs: 'marketplace-services'
    };
  }

  getColumns = () => this.serviceInstanceColumns;
  getDataSource = () => this.dataSource;
}
