import { InstancesTabComponent } from './application/application-tabs-base/tabs/instances-tab/instances-tab.component';
import { AddRoutesComponent } from './routes/add-routes/add-routes.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ApplicationWallComponent } from './application-wall/application-wall.component';
import { ApplicationBaseComponent } from './application/application-base.component';
import { EventsTabComponent } from './application/application-tabs-base/tabs/events-tab/events-tab.component';
import { LogStreamTabComponent } from './application/application-tabs-base/tabs/log-stream-tab/log-stream-tab.component';
import { ServicesTabComponent } from './application/application-tabs-base/tabs/services-tab/services-tab.component';
import { BuildTabComponent } from './application/application-tabs-base/tabs/build-tab/build-tab.component';
import { VariablesTabComponent } from './application/application-tabs-base/tabs/variables-tab/variables-tab.component';
import { CreateApplicationComponent } from './create-application/create-application.component';
import { CreateApplicationModule } from './create-application/create-application.module';
import { SshApplicationComponent } from './ssh-application/ssh-application.component';
import { EditApplicationComponent } from './edit-application/edit-application.component';
import { ApplicationTabsBaseComponent } from './application/application-tabs-base/application-tabs-base.component';
import { DeployApplicationComponent } from './deploy-application/deploy-application.component';
import { DeployApplicationModule } from './deploy-application/deploy-application.module';
import { GithubTabComponent } from './application/application-tabs-base/tabs/github-tab/github-tab.component';
const appplicationsRoutes: Routes = [
  {
    path: 'new',
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
      },
      {
        path: ':cfId/:id',
        component: ApplicationBaseComponent,
        children: [
          {
            path: 'edit',
            component: EditApplicationComponent,
          },
          {
            path: 'ssh/:index',
            component: SshApplicationComponent,
          },
          {
            path: '',
            component: ApplicationTabsBaseComponent,
            data: {
              uiFullView: true
            },
            children: [
              { path: '', redirectTo: 'summary', pathMatch: 'full' },
              { path: 'summary', component: BuildTabComponent },
              { path: 'instances', component: InstancesTabComponent },
              { path: 'log-stream', component: LogStreamTabComponent },
              { path: 'services', component: ServicesTabComponent },
              { path: 'variables', component: VariablesTabComponent },
              { path: 'events', component: EventsTabComponent },
              { path: 'github', component: GithubTabComponent },
            ]
          },
          {
            path: 'add-route',
            component: AddRoutesComponent,
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [
    CreateApplicationModule,
    DeployApplicationModule,
    RouterModule.forChild(appplicationsRoutes)

  ]
})
export class ApplicationsRoutingModule { }
