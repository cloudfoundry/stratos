import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DynamicExtensionRoutes } from '../../../../core/src/core/extension/dynamic-extension-routes';
import { StratosActionType, StratosTabType } from '../../../../core/src/core/extension/extension-service';
import {
  PageNotFoundComponentComponent,
} from '../../../../core/src/core/page-not-found-component/page-not-found-component.component';
import {
  AddServiceInstanceBaseStepComponent,
} from '../../shared/components/add-service-instance/add-service-instance-base-step/add-service-instance-base-step.component';
import {
  AddServiceInstanceComponent,
} from '../../shared/components/add-service-instance/add-service-instance/add-service-instance.component';
import { ApplicationDeleteComponent } from './application-delete/application-delete.component';
import { ApplicationWallComponent } from './application-wall/application-wall.component';
import { ApplicationBaseComponent } from './application/application-base.component';
import { ApplicationTabsBaseComponent } from './application/application-tabs-base/application-tabs-base.component';
import { BuildTabComponent } from './application/application-tabs-base/tabs/build-tab/build-tab.component';
import { EventsTabComponent } from './application/application-tabs-base/tabs/events-tab/events-tab.component';
import { GitSCMTabComponent } from './application/application-tabs-base/tabs/gitscm-tab/gitscm-tab.component';
import { InstancesTabComponent } from './application/application-tabs-base/tabs/instances-tab/instances-tab.component';
import { LogStreamTabComponent } from './application/application-tabs-base/tabs/log-stream-tab/log-stream-tab.component';
import { MetricsTabComponent } from './application/application-tabs-base/tabs/metrics-tab/metrics-tab.component';
import { RoutesTabComponent } from './application/application-tabs-base/tabs/routes-tab/routes-tab/routes-tab.component';
import { ServicesTabComponent } from './application/application-tabs-base/tabs/services-tab/services-tab.component';
import { VariablesTabComponent } from './application/application-tabs-base/tabs/variables-tab/variables-tab.component';
import { CliInfoApplicationComponent } from './cli-info-application/cli-info-application.component';
import { CreateApplicationComponent } from './create-application/create-application.component';
import { CreateApplicationModule } from './create-application/create-application.module';
import { DeployApplicationComponent } from './deploy-application/deploy-application.component';
import { DeployApplicationModule } from './deploy-application/deploy-application.module';
import { EditApplicationComponent } from './edit-application/edit-application.component';
import { NewApplicationBaseStepComponent } from './new-application-base-step/new-application-base-step.component';
import { AddRouteStepperComponent } from './routes/add-route-stepper/add-route-stepper.component';
import { SshApplicationComponent } from './ssh-application/ssh-application.component';

const applicationsRoutes: Routes = [
  {
    path: 'new',
    component: NewApplicationBaseStepComponent,
    pathMatch: 'full'
  },
  {
    path: 'new/:endpointId',
    component: NewApplicationBaseStepComponent,
    pathMatch: 'full'
  },
  {
    path: 'create',
    component: CreateApplicationComponent,
  },
  {
    path: 'deploy',
    component: DeployApplicationComponent
  },
  {
    path: '',
    children: [
      {
        path: '',
        component: ApplicationWallComponent,
        pathMatch: 'full',
        data: {
          extensionsActionsKey: StratosActionType.Applications
        }
      },
      {
        path: ':endpointId',
        component: ApplicationWallComponent,
        pathMatch: 'full'
      },
      {
        path: ':endpointId/:id',
        component: ApplicationBaseComponent,
        children: [
          {
            path: 'delete',
            component: ApplicationDeleteComponent
          },
          {
            path: 'edit',
            component: EditApplicationComponent,
          },
          {
            path: 'ssh/:index',
            component: SshApplicationComponent,
          },
          {
            path: 'cli',
            component: CliInfoApplicationComponent,
          },
          {
            path: 'bind',
            component: AddServiceInstanceBaseStepComponent,
            data: {
              bind: true
            }
          },
          {
            path: 'bind/:type',
            component: AddServiceInstanceComponent,
          },
          {
            path: '',
            component: ApplicationTabsBaseComponent,
            data: {
              extensionsActionsKey: StratosActionType.Application
            },
            children: [
              { path: '', redirectTo: 'summary', pathMatch: 'full' },
              { path: 'summary', component: BuildTabComponent },
              { path: 'instances', component: InstancesTabComponent },
              { path: 'routes', component: RoutesTabComponent },
              { path: 'log-stream', component: LogStreamTabComponent },
              { path: 'services', component: ServicesTabComponent },
              { path: 'variables', component: VariablesTabComponent },
              { path: 'events', component: EventsTabComponent },
              { path: 'gitscm', component: GitSCMTabComponent },
              { path: 'metrics', component: MetricsTabComponent },
              {
                path: '**',
                component: PageNotFoundComponentComponent,
                canActivate: [DynamicExtensionRoutes],
                data: {
                  stratosRouteGroup: StratosTabType.Application
                }
              }
            ]
          },
          {
            path: 'add-route',
            component: AddRouteStepperComponent,
          },
          {
            path: '**',
            component: PageNotFoundComponentComponent,
            canActivate: [DynamicExtensionRoutes],
            data: {
              stratosRouteGroup: StratosActionType.Application
            }
          }
        ]
      }
    ]
  },
  {
    path: '**',
    component: PageNotFoundComponentComponent,
    canActivate: [DynamicExtensionRoutes],
    data: {
      stratosRouteGroup: StratosActionType.Applications
    }
  }
];

@NgModule({
  imports: [
    CreateApplicationModule,
    DeployApplicationModule,
    RouterModule.forChild(applicationsRoutes)
  ]
})
export class ApplicationsRoutingModule { }
