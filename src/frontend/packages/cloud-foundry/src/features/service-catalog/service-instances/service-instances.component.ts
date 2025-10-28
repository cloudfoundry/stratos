import { Component } from '@angular/core';

import { ListComponent } from '../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import {
  ServiceInstancesListConfigService,
} from '../../../shared/components/list/list-types/service-instances/service-instances-list-config.service';

@Component({
  selector: 'app-service-instances',
  templateUrl: './service-instances.component.html',
  styleUrls: ['./service-instances.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: ServiceInstancesListConfigService
    }
  ],
  standalone: true,
  imports: [
    ListComponent
  ]
})
export class ServiceInstancesComponent { }
