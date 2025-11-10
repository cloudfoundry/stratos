import { Component, ChangeDetectionStrategy } from '@angular/core';

import { ListConfig } from '@stratosui/core';
import {
  CfOrganizationEventsConfigService,
} from '../../../../../shared/components/list/list-types/cf-events/types/cf-org-events-config.service';
import { CloudFoundryEventsListComponent } from '../../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';

@Component({
  selector: 'app-cloud-foundry-organization-events',
  templateUrl: './cloud-foundry-organization-events.component.html',
  styleUrls: ['./cloud-foundry-organization-events.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfOrganizationEventsConfigService,
  }],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CloudFoundryEventsListComponent
  ]
})
export class CloudFoundryOrganizationEventsComponent { }
