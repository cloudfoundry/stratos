import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfUserServiceInstancesListConfigBase,
} from '../../../../../../../shared/components/list/list-types/cf-services/cf-user-service-instances-list-config';

@Component({
  selector: 'app-cloud-foundry-space-user-service-instances',
  templateUrl: './cloud-foundry-space-user-service-instances.component.html',
  styleUrls: ['./cloud-foundry-space-user-service-instances.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfUserServiceInstancesListConfigBase
    }
  ]
})
export class CloudFoundrySpaceUserServiceInstancesComponent { }
