import { Component, OnInit } from '@angular/core';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { CfEventsConfigService } from '../../../../shared/components/list/list-types/cf-events/cf-events-config.service';

@Component({
  selector: 'app-cloud-foundry-events',
  templateUrl: './cloud-foundry-events.component.html',
  styleUrls: ['./cloud-foundry-events.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfEventsConfigService,
  }]
})
export class CloudFoundryEventsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
