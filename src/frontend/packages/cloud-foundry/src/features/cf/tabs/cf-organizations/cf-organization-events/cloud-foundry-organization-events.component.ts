import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { CloudFoundryEventsListComponent } from '../../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';

// Org-scoped Events tab. Passes orgGuid to the shared events list so
// only events scoped to the active org show.
@Component({
  selector: 'app-cloud-foundry-organization-events',
  templateUrl: './cloud-foundry-organization-events.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CloudFoundryEventsListComponent,
  ],
})
export class CloudFoundryOrganizationEventsComponent {
  activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
}
