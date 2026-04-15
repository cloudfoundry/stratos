import { Component, ChangeDetectionStrategy } from '@angular/core';

import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { CloudFoundryEventsListComponent } from '../../../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';
import {
  CfAppEventsConfigService,
} from '../../../../../../shared/components/list/list-types/cf-events/types/cf-app-events-config.service';

@Component({
  selector: 'app-events-tab',
  templateUrl: './events-tab.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: ListConfig,
    useClass: CfAppEventsConfigService,
  }],
  imports: [
    CloudFoundryEventsListComponent
  ]
})
export class EventsTabComponent { }
