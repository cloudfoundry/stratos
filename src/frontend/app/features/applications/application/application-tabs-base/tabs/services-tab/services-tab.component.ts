import { Component } from '@angular/core';

import {
  AppServiceBindingListConfigService,
} from '../../../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-services-tab',
  templateUrl: './services-tab.component.html',
  styleUrls: ['./services-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: AppServiceBindingListConfigService
    }
  ]
})
export class ServicesTabComponent {

}
