import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ITableText } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { CfServiceInstancesListConfigBase } from '../cf-services/cf-service-instances-list-config.base';
import { ServiceInstancesDataSource } from './service-instances-data-source';

/**
 * Service instance list shown for `service / service instances` component
 *
 * @export
 * @extends {CfServiceInstancesListConfigBase}
 */
@Injectable({
  providedIn: 'root'
})
export class ServiceInstancesListConfigService extends CfServiceInstancesListConfigBase {

  enableTextFilter = true;
  text: ITableText = {
    title: null,
    filter: 'Filter by Name',
    noEntries: 'There are no service instances',
  };

  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const servicesService = inject(ServicesService);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);
    const serviceActionHelperService = inject(ServiceActionHelperService);

    super(
      `/marketplace/${servicesService.cfGuid}/${servicesService.serviceGuid}/instances`
    );
    // Remove 'Service' column
    this.serviceInstanceColumns.splice(1, 1);
    this.dataSource = new ServiceInstancesDataSource(servicesService.cfGuid, servicesService.serviceGuid, store, this);
    this.serviceInstanceColumns.find(column => column.columnId === 'attachedApps').cellConfig = {
      breadcrumbs: 'marketplace-services'
    };
  }

  getDataSource = () => this.dataSource;
}
