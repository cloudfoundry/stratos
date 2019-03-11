import { DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ApplicationMonitorService } from './application-monitor.service';
import { ApplicationWallComponent } from './application-wall/application-wall.component';
import { ApplicationService } from './application.service';
import { ApplicationBaseComponent } from './application/application-base.component';
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
import { AutoscalerTabComponent } from './application/application-tabs-base/tabs/autoscaler-tab/autoscaler-tab.component';
import { MetricsTabComponent } from './application/application-tabs-base/tabs/metrics-tab/metrics-tab.component';
import { RoutesTabComponent } from './application/application-tabs-base/tabs/routes-tab/routes-tab/routes-tab.component';
import { ServicesTabComponent } from './application/application-tabs-base/tabs/services-tab/services-tab.component';
import { VariablesTabComponent } from './application/application-tabs-base/tabs/variables-tab/variables-tab.component';
import { ApplicationsRoutingModule } from './applications.routing';
import { EditApplicationComponent } from './edit-application/edit-application.component';
import { EditAutoscalerPolicyComponent } from './edit-autoscaler-policy/edit-autoscaler-policy.component';
import { AutoscalerMetricPageComponent } from './autoscaler-metric-page/autoscaler-metric-page.component';
import { AutoscalerScaleHistoryPageComponent } from './autoscaler-scale-history-page/autoscaler-scale-history-page.component';
import { AddRouteStepperComponent } from './routes/add-route-stepper/add-route-stepper.component';
import { AddRoutesComponent } from './routes/add-routes/add-routes.component';
import { MapRoutesComponent } from './routes/map-routes/map-routes.component';
import { SshApplicationComponent } from './ssh-application/ssh-application.component';
import { CliInfoApplicationComponent } from './cli-info-application/cli-info-application.component';
import { ApplicationDeleteComponent } from './application-delete/application-delete.component';
import { DeleteAppRoutesComponent } from './application-delete/delete-app-routes/delete-app-routes.component';
import { DeleteAppServiceInstancesComponent } from './application-delete/delete-app-instances/delete-app-instances.component';
import { CustomImportModule } from '../../custom-import.module';
import { NewApplicationBaseStepComponent } from './new-application-base-step/new-application-base-step.component';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    ApplicationsRoutingModule,
    CustomImportModule,
    NgxChartsModule
  ],
  declarations: [
    ApplicationWallComponent,
    ApplicationBaseComponent,
    EventsTabComponent,
    LogStreamTabComponent,
    AutoscalerTabComponent,
    ServicesTabComponent,
    BuildTabComponent,
    VariablesTabComponent,
    ViewBuildpackComponent,
    ApplicationTabsBaseComponent,
    SshApplicationComponent,
    EditApplicationComponent,
    EditAutoscalerPolicyComponent,
    AutoscalerMetricPageComponent,
    AutoscalerScaleHistoryPageComponent,
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
  ],
  providers: [
    ApplicationService,
    ApplicationEnvVarsHelper,
    ApplicationMonitorService,
    DatePipe
  ]
})
export class ApplicationsModule { }
