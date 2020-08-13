import { Component } from '@angular/core';

import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import {
  ServicePlansListConfigService,
} from '../../../shared/components/list/list-types/service-plans/service-plans-list-config.service';

@Component({
  selector: 'app-service-plans',
  templateUrl: './service-plans.component.html',
  styleUrls: ['./service-plans.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: ServicePlansListConfigService
    }
  ]
})
export class ServicePlansComponent { }
