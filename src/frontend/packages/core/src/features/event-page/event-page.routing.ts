import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EventsPageComponent } from './events-page/events-page.component';

const eventPage: Routes = [{
  path: '',
  component: EventsPageComponent
}, {
  path: 'endpoints',
  component: EventsPageComponent
}];

@NgModule({
  imports: [RouterModule.forChild(eventPage)]
})
export class EventPageRoutingModule { }
