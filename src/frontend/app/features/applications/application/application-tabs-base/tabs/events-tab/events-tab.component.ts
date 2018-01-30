import { CfAppEventsConfigService } from '../../../../../../shared/list-configs/cf-app-events-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component';
import { Component } from '@angular/core';

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
  constructor() { }
}
