import { NgModule } from '@angular/core';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ApplicationWallComponent } from './application-wall/application-wall.component';
import { ApplicationService } from './application.service';
import { ApplicationBaseComponent } from './application/application-base.component';
import { EventsTabComponent } from './application/application-tabs-base/tabs/events-tab/events-tab.component';
import { LogStreamTabComponent } from './application/application-tabs-base/tabs/log-stream-tab/log-stream-tab.component';
import { ServicesTabComponent } from './application/application-tabs-base/tabs/services-tab/services-tab.component';
import { SshTabComponent } from './application/application-tabs-base/tabs/ssh-tab/ssh-tab.component';
import { ApplicationEnvVarsService } from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { BuildTabComponent } from './application/application-tabs-base/tabs/build-tab/build-tab.component';
import { ViewBuildpackComponent } from './application/application-tabs-base/tabs/build-tab/view-buildpack/view-buildpack.component';
import { VariablesTabComponent } from './application/application-tabs-base/tabs/variables-tab/variables-tab.component';
import { ApplicationsRoutingModule } from './applications.routing';
import { ApplicationTabsBaseComponent } from './application/application-tabs-base/application-tabs-base.component';
import { DatePipe } from '@angular/common';
import { EditApplicationComponent } from './edit-application/edit-application.component';
import { InstancesTabComponent } from './application/application-tabs-base/tabs/instances-tab/instances-tab.component';
import { ApplicationMonitorService } from './application-monitor.service';
import { RoutesComponent } from './routes/routes.component';
import { AddRoutesComponent } from './routes/add-routes/add-routes.component';

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
    ApplicationTabsBaseComponent,
    RoutesComponent,
    EditApplicationComponent,
    InstancesTabComponent,
    AddRoutesComponent
  ],
  providers: [
    ApplicationService,
    ApplicationEnvVarsService,
    ApplicationMonitorService,
    DatePipe
  ]
})
export class ApplicationsModule { }
