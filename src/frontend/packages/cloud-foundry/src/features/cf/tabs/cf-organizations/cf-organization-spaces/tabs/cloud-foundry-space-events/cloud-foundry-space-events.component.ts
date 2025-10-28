import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfSpaceEventsConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-events/types/cf-space-events-config.service';
import { CloudFoundryEventsListComponent } from '../../../../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';

@Component({
  selector: 'app-cloud-foundry-space-events',
  templateUrl: './cloud-foundry-space-events.component.html',
  styleUrls: ['./cloud-foundry-space-events.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfSpaceEventsConfigService
  }],
  standalone: true,
  imports: [
    CloudFoundryEventsListComponent
  ]
})
export class CloudFoundrySpaceEventsComponent { }
