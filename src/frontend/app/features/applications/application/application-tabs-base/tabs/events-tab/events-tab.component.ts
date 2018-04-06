import { Component, HostBinding } from '@angular/core';

import {
  CfAppEventsConfigService,
} from '../../../../../../shared/components/list/list-types/app-event/cf-app-events-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-events-tab',
  templateUrl: './events-tab.component.html',
  styleUrls: ['./events-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfAppEventsConfigService,
  }]
})

export class EventsTabComponent {
  @HostBinding('class') class = 'router-component';
}
