import { DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';

import { CfAutoscalerModule } from '../../../../cf-autoscaler/src/cf-autoscaler.module';
import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { CloudFoundrySharedModule } from '../../shared/cf-shared.module';
import { ApplicationDeleteComponent } from './application-delete/application-delete.component';
import {
  DeleteAppServiceInstancesComponent,
} from './application-delete/delete-app-instances/delete-app-instances.component';
import { DeleteAppRoutesComponent } from './application-delete/delete-app-routes/delete-app-routes.component';
import { ApplicationMonitorService } from './application-monitor.service';
import { ApplicationWallComponent } from './application-wall/application-wall.component';
import { ApplicationService } from './application.service';
import { ApplicationBaseComponent } from './application/application-base.component';
import { ApplicationPollComponent } from './application/application-tabs-base/application-poll/application-poll.component';
import { ApplicationTabsBaseComponent } from './application/application-tabs-base/application-tabs-base.component';
import { ApplicationEnvVarsHelper } from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { BuildTabComponent } from './application/application-tabs-base/tabs/build-tab/build-tab.component';
import {
  ViewBuildpackComponent,
} from './application/application-tabs-base/tabs/build-tab/view-buildpack/view-buildpack.component';
import { EventsTabComponent } from './application/application-tabs-base/tabs/events-tab/events-tab.component';
import { GitSCMTabComponent } from './application/application-tabs-base/tabs/gitscm-tab/gitscm-tab.component';
import { InstancesTabComponent } from './application/application-tabs-base/tabs/instances-tab/instances-tab.component';
import { LogStreamTabComponent } from './application/application-tabs-base/tabs/log-stream-tab/log-stream-tab.component';
import { MetricsTabComponent } from './application/application-tabs-base/tabs/metrics-tab/metrics-tab.component';
import { RoutesTabComponent } from './application/application-tabs-base/tabs/routes-tab/routes-tab/routes-tab.component';
import { ServicesTabComponent } from './application/application-tabs-base/tabs/services-tab/services-tab.component';
import { VariablesTabComponent } from './application/application-tabs-base/tabs/variables-tab/variables-tab.component';
import { ApplicationsRoutingModule } from './applications.routing';
import { CliInfoApplicationComponent } from './cli-info-application/cli-info-application.component';
import { ApplicationDeploySourceTypes } from './deploy-application/deploy-application-steps.types';
import { EditApplicationComponent } from './edit-application/edit-application.component';
import { NewApplicationBaseStepComponent } from './new-application-base-step/new-application-base-step.component';
import { AddRouteStepperComponent } from './routes/add-route-stepper/add-route-stepper.component';
import { AddRoutesComponent } from './routes/add-routes/add-routes.component';
import { MapRoutesComponent } from './routes/map-routes/map-routes.component';
import { SshApplicationComponent } from './ssh-application/ssh-application.component';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    ApplicationsRoutingModule,
    CloudFoundrySharedModule,
    // FIXME: Remove hard link between cf and autoscaler packages #4416
    CfAutoscalerModule
  ],
  declarations: [
    ApplicationWallComponent,
    ApplicationBaseComponent,
    EventsTabComponent,
    LogStreamTabComponent,
    ServicesTabComponent,
    BuildTabComponent,
    VariablesTabComponent,
    ViewBuildpackComponent,
    ApplicationTabsBaseComponent,
    SshApplicationComponent,
    EditApplicationComponent,
    InstancesTabComponent,
    AddRoutesComponent,
    GitSCMTabComponent,
    MapRoutesComponent,
    AddRouteStepperComponent,
    CliInfoApplicationComponent,
    MetricsTabComponent,
    RoutesTabComponent,
    ApplicationDeleteComponent,
    DeleteAppRoutesComponent,
    DeleteAppServiceInstancesComponent,
    NewApplicationBaseStepComponent,
    ApplicationPollComponent
  ],
  providers: [
    ApplicationService,
    ApplicationEnvVarsHelper,
    ApplicationMonitorService,
    DatePipe,
    ApplicationDeploySourceTypes,
  ]
})
export class ApplicationsModule { }
