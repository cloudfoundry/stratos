import { Component } from '@angular/core';

import {
  CfSpacesServiceInstancesListConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-spaces-service-instances/cf-spaces-service-instances-list-config.service';
import { ListConfig } from '../../../../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-cloud-foundry-space-service-instances',
  templateUrl: './cloud-foundry-space-service-instances.component.html',
  styleUrls: ['./cloud-foundry-space-service-instances.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSpacesServiceInstancesListConfigService
    }
  ]
})
export class CloudFoundrySpaceServiceInstancesComponent { }
