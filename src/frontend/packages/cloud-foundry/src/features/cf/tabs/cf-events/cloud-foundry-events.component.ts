import { Component, ChangeDetectionStrategy } from '@angular/core';

import { CloudFoundryEventsListComponent } from '../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';

// CF foundation-wide Events tab. No scoping inputs — surfaces every
// audit event the foundation emits (capped at 25k by the backend).
@Component({
  selector: 'app-cloud-foundry-events',
  templateUrl: './cloud-foundry-events.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [
    CloudFoundryEventsListComponent,
  ],
})
export class CloudFoundryEventsComponent { }
