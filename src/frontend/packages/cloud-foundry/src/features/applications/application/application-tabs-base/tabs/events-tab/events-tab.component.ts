import { Component } from '@angular/core';

import { ListComponent } from '../../../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfAppEventsConfigService,
} from '../../../../../../shared/components/list/list-types/cf-events/types/cf-app-events-config.service';

@Component({
  selector: 'app-events-tab',
  templateUrl: './events-tab.component.html',
  styleUrls: ['./events-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfAppEventsConfigService,
  }],
  standalone: true,
  imports: [ListComponent]
})
export class EventsTabComponent { }
