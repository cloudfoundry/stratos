import { DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';

import { ListComponent, ListConfig, NoContentMessageComponent } from '@stratosui/core';
import {
  AppServiceBindingListConfigService,
} from '../../../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';

@Component({
  selector: 'app-services-tab',
  templateUrl: './services-tab.component.html',
  styleUrls: ['./services-tab.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DatePipe,
    {
      provide: ListConfig,
      useClass: AppServiceBindingListConfigService
    }
  ],
  imports: [
    ListComponent,
    NoContentMessageComponent
  ]
})
export class ServicesTabComponent { }
