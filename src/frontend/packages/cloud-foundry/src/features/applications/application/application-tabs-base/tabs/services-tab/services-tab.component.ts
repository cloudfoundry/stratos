import { Component } from '@angular/core';

import { ListComponent } from '../../../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { NoContentMessageComponent } from '../../../../../../../../core/src/shared/components/no-content-message/no-content-message.component';
import {
  AppServiceBindingListConfigService,
} from '../../../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';

@Component({
  selector: 'app-services-tab',
  templateUrl: './services-tab.component.html',
  styleUrls: ['./services-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: AppServiceBindingListConfigService
    }
  ],
  standalone: true,
  imports: [
    ListComponent,
    NoContentMessageComponent
  ]
})
export class ServicesTabComponent { }
