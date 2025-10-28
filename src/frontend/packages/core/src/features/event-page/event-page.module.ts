import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { EventPageRoutingModule } from './event-page.routing';
import { EventsPageComponent } from './events-page/events-page.component';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    EventPageRoutingModule,
    EventsPageComponent
  ]
})
export class EventPageModule { }
