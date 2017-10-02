import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ApplicationStateService } from './application-state.service';
import { ApplicationWallComponent } from './application-wall/application-wall.component';
import { ApplicationBaseComponent } from './application/application-base.component';
import { EventsTabComponent } from './application/events-tab/events-tab.component';
import { LogStreamTabComponent } from './application/log-stream-tab/log-stream-tab.component';
import { ServicesTabComponent } from './application/services-tab/services-tab.component';
import { SshTabComponent } from './application/ssh-tab/ssh-tab.component';
import { SummaryTabComponent } from './application/summary-tab/summary-tab.component';
import { ViewBuildpackComponent } from './application/summary-tab/view-buildpack/view-buildpack.component';
import { VariablesTabComponent } from './application/variables-tab/variables-tab.component';
import { ApplicationsRoutingModule } from './applications.routing';
import { CreateApplicationModule } from './create-application/create-application.module';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    ApplicationsRoutingModule,
    CreateApplicationModule
  ],
  declarations: [
    ApplicationWallComponent,
    ApplicationBaseComponent,
    EventsTabComponent,
    LogStreamTabComponent,
    ServicesTabComponent,
    SshTabComponent,
    SummaryTabComponent,
    VariablesTabComponent,
    ViewBuildpackComponent
  ],
  providers: [
    ApplicationStateService
  ]
})
export class ApplicationsModule { }
