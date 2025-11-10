import { Component , ChangeDetectionStrategy } from '@angular/core';

import { ListComponent, ListConfig } from '@stratosui/core';
import {
  CfUserServiceInstancesListConfigBase,
} from '../../../../../../../shared/components/list/list-types/cf-services/cf-user-service-instances-list-config';

@Component({
  selector: 'app-cloud-foundry-space-user-service-instances',
  templateUrl: './cloud-foundry-space-user-service-instances.component.html',
  styleUrls: ['./cloud-foundry-space-user-service-instances.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: CfUserServiceInstancesListConfigBase
    }
  ]
})
export class CloudFoundrySpaceUserServiceInstancesComponent { }
