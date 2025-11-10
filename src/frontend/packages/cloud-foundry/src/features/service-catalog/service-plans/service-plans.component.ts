import { DatePipe } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';

import { ListConfig, ListComponent } from '@stratosui/core';
import { ServicePlansListConfigService } from '../../../shared/components/list/list-types/service-plans/service-plans-list-config.service';

@Component({
  selector: 'app-service-plans',
  templateUrl: './service-plans.component.html',
  styleUrls: ['./service-plans.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ],
  providers: [
    DatePipe,
    {
      provide: ListConfig,
      useClass: ServicePlansListConfigService
    }
  ]
})
export class ServicePlansComponent { }
