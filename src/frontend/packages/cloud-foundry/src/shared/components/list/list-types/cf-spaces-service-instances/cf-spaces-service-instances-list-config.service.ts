import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../cf-api-svc.types';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { CfServiceInstancesListConfigBase } from '../cf-services/cf-service-instances-list-config.base';
import { CfSpacesServiceInstancesDataSource } from './cf-spaces-service-instances-data-source';

/**
 * Service instance list shown for `cf / org / space / service instances` tab
 *
 * @export
 * @extends {CfServiceInstancesListConfigBase}
 */
@Injectable()
export class CfSpacesServiceInstancesListConfigService extends CfServiceInstancesListConfigBase
  implements IListConfig<APIResource<IServiceInstance>>  {

  constructor(
    store: Store<CFAppState>,
    cfSpaceService: CloudFoundrySpaceService,
    datePipe: DatePipe,
    currentUserPermissionsService: CurrentUserPermissionsService,
    serviceActionHelperService: ServiceActionHelperService) {
    super(store, datePipe, currentUserPermissionsService, serviceActionHelperService);
    this.dataSource = new CfSpacesServiceInstancesDataSource(cfSpaceService.cfGuid, cfSpaceService.spaceGuid, this.store, this);
    this.serviceInstanceColumns.find(column => column.columnId === 'attachedApps').cellConfig = {
      breadcrumbs: 'space-services'
    };
  }

  getDataSource = () => this.dataSource;

}
