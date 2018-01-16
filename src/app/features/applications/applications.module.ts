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
import { ApplicationEnvVarsService } from './application/build-tab/application-env-vars.service';
import { BuildTabComponent } from './application/build-tab/build-tab.component';
import { ViewBuildpackComponent } from './application/build-tab/view-buildpack/view-buildpack.component';
import { VariablesTabComponent } from './application/variables-tab/variables-tab.component';
import { ApplicationsRoutingModule } from './applications.routing';
import { DatePipe } from '@angular/common';
import { InstancesTabComponent } from './application/instances-tab/instances-tab.component';
import { ApplicationMonitorService } from './application-monitor.service';


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
    BuildTabComponent,
    VariablesTabComponent,
    ViewBuildpackComponent,
    InstancesTabComponent,
  ],
  providers: [
    ApplicationService,
    ApplicationEnvVarsService,
    ApplicationMonitorService,
    DatePipe
  ]
})
export class ApplicationsModule { }
