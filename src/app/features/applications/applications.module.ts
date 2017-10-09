import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ApplicationWallComponent } from './application-wall/application-wall.component';
import { ApplicationService } from './application.service';
import { ApplicationBaseComponent } from './application/application-base.component';
import { EventsTabComponent } from './application/events-tab/events-tab.component';
import { LogStreamTabComponent } from './application/log-stream-tab/log-stream-tab.component';
import { ServicesTabComponent } from './application/services-tab/services-tab.component';
import { SshTabComponent } from './application/ssh-tab/ssh-tab.component';
import { ApplicationEnvVarsService } from './application/summary-tab/application-env-vars.service';
import {
  ApplicationStateIconComponent,
} from './application/summary-tab/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from './application/summary-tab/application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from './application/summary-tab/application-state/application-state.component';
import { ApplicationStateService } from './application/summary-tab/application-state/application-state.service';
import { SummaryTabComponent } from './application/summary-tab/summary-tab.component';
import { ViewBuildpackComponent } from './application/summary-tab/view-buildpack/view-buildpack.component';
import { VariablesTabComponent } from './application/variables-tab/variables-tab.component';
import { ApplicationsRoutingModule } from './applications.routing';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    ApplicationsRoutingModule
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
    ViewBuildpackComponent,
    ApplicationStateIconPipe,
    ApplicationStateIconComponent,
    ApplicationStateComponent
  ],
  providers: [
    ApplicationService,
    ApplicationStateService,
    ApplicationEnvVarsService
  ]
})
export class ApplicationsModule { }
