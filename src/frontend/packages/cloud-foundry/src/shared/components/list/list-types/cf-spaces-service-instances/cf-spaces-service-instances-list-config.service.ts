import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../cf-api-svc.types';
import { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { CfServiceInstancesListConfigBase } from '../cf-services/cf-service-instances-list-config.base';
import { CfSpacesServiceInstancesDataSource } from './cf-spaces-service-instances-data-source';

/**
 * Service instance list shown for `cf / org / space / service instances` tab
 *
 * @export
 * @extends {CfServiceInstancesListConfigBase}
 */
@Injectable({
  providedIn: 'root'
})
export class CfSpacesServiceInstancesListConfigService extends CfServiceInstancesListConfigBase
  implements IListConfig<APIResource<IServiceInstance>>  {

  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const cfSpaceService = inject(CloudFoundrySpaceService);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);
    const serviceActionHelperService = inject(ServiceActionHelperService);

    super(
      `/cloud-foundry/${cfSpaceService.cfGuid}/organizations/${cfSpaceService.orgGuid}/spaces/${cfSpaceService.spaceGuid}/service-instances`
    );
    this.dataSource = new CfSpacesServiceInstancesDataSource(cfSpaceService.cfGuid, cfSpaceService.spaceGuid, this.store, this);
    this.serviceInstanceColumns.find(column => column.columnId === 'attachedApps').cellConfig = {
      breadcrumbs: 'space-services'
    };
  }

  getDataSource = () => this.dataSource;

}
