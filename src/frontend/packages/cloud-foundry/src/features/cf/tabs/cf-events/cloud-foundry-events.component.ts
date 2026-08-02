import { Component, ChangeDetectionStrategy } from '@angular/core';

import { CloudFoundryEventsListComponent } from '../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';

// CF foundation-wide Events tab. No scoping inputs — surfaces the
// foundation's audit events, newest first (the source caps the drain
// at the most recent 25k).
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
