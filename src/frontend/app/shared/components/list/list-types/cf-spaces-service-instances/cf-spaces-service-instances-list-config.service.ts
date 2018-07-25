import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IServiceInstance } from '../../../../../core/cf-api-svc.types';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { IListConfig } from '../../list.component.types';
import { CfServiceInstancesListConfigBase } from '../cf-services/cf-service-instances-list-config.base';
import { CfSpacesServiceInstancesDataSource } from './cf-spaces-service-instances-data-source';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';

/**
 * Service instance list shown for `cf / org / space / service instances` tab
 *
 * @export
 * @class CfSpacesServiceInstancesListConfigService
 * @extends {CfServiceInstancesListConfigBase}
 * @implements {IListConfig<APIResource<IServiceInstance>>}
 */
@Injectable()
export class CfSpacesServiceInstancesListConfigService extends CfServiceInstancesListConfigBase
  implements IListConfig<APIResource<IServiceInstance>>  {

  constructor(
    store: Store<AppState>,
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
