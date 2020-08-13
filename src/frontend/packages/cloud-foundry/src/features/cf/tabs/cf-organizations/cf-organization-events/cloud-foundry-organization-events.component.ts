import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfOrganizationEventsConfigService,
} from '../../../../../shared/components/list/list-types/cf-events/types/cf-org-events-config.service';

@Component({
  selector: 'app-cloud-foundry-organization-events',
  templateUrl: './cloud-foundry-organization-events.component.html',
  styleUrls: ['./cloud-foundry-organization-events.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfOrganizationEventsConfigService,
  }]
})
export class CloudFoundryOrganizationEventsComponent { }
