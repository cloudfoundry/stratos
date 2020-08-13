import { NgModule } from '@angular/core';
import { EventsPageComponent } from './events-page/events-page.component';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { EventPageRoutingModule } from './event-page.routing';

@NgModule({
  declarations: [EventsPageComponent],
  imports: [
    CoreModule,
    SharedModule,
    EventPageRoutingModule
  ]
})
export class EventPageModule { }
