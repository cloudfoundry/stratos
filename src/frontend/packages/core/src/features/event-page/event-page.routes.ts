import type { Routes } from '@angular/router';

import { EventsPageComponent } from './events-page/events-page.component';

export const EVENT_PAGE_ROUTES: Routes = [{
  path: '',
  component: EventsPageComponent
}, {
  path: 'endpoints',
  component: EventsPageComponent
}];
