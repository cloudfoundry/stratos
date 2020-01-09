import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfAllEventsConfigService,
} from '../../../../shared/components/list/list-types/cf-events/types/cf-all-events-config.service';

@Component({
  selector: 'app-cloud-foundry-events',
  templateUrl: './cloud-foundry-events.component.html',
  styleUrls: ['./cloud-foundry-events.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfAllEventsConfigService,
  }]
})
export class CloudFoundryEventsComponent { }
