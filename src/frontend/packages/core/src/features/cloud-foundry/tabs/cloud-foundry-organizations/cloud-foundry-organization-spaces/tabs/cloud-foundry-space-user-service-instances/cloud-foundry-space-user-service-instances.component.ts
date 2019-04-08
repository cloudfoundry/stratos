import { Component } from '@angular/core';

import {
  CfUserServiceInstancesListConfigBase,
} from '../../../../../../../shared/components/list/list-types/cf-services/cf-user-service-instances-list-config';
import { ListConfig } from '../../../../../../../shared/components/list/list.component.types';

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
