import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { CloudFoundryEventsListComponent } from '../../../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';
import { ApplicationService } from '../../../../application.service';

// App-scoped Events tab. Passes the appGuid as targetGuid plus
// `typeMustContain='audit.app'` so platform-level events (org / space
// CRUD) don't bleed into the app event log.
@Component({
  selector: 'app-events-tab',
  templateUrl: './events-tab.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CloudFoundryEventsListComponent,
  ],
})
export class EventsTabComponent {
  applicationService = inject(ApplicationService);
}
