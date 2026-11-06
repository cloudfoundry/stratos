import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { CloudFoundryEventsListComponent } from '../../../../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';
import { ActiveRouteCfOrgSpace } from '../../../../../cf-page.types';

// Space-scoped Events tab. Passes spaceGuid to the shared events list
// so only events scoped to the active space show.
@Component({
  selector: 'app-cloud-foundry-space-events',
  templateUrl: './cloud-foundry-space-events.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CloudFoundryEventsListComponent,
  ],
})
export class CloudFoundrySpaceEventsComponent {
  activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
}
