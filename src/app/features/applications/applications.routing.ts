import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ApplicationWallComponent } from './application-wall/application-wall.component';
import { ApplicationBaseComponent } from './application/application-base.component';
import { InstancesTabComponent } from './application/instances-tab/instances-tab.component';
import { EventsTabComponent } from './application/events-tab/events-tab.component';
import { LogStreamTabComponent } from './application/log-stream-tab/log-stream-tab.component';
import { ServicesTabComponent } from './application/services-tab/services-tab.component';
import { SshTabComponent } from './application/ssh-tab/ssh-tab.component';
import { BuildTabComponent } from './application/build-tab/build-tab.component';
import { VariablesTabComponent } from './application/variables-tab/variables-tab.component';
import { CreateApplicationComponent } from './create-application/create-application.component';
import { CreateApplicationModule } from './create-application/create-application.module';

const appplicationsRoutes: Routes = [
  {
    path: 'new',
    component: CreateApplicationComponent
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
        data: {
          uiFullView: true
        },
        children: [
          { path: '', redirectTo: 'build', pathMatch: 'full' },
          { path: 'build', component: BuildTabComponent },
          { path: 'instances', component: InstancesTabComponent },
          { path: 'log-stream', component: LogStreamTabComponent },
          { path: 'services', component: ServicesTabComponent },
          { path: 'variables', component: VariablesTabComponent },
          { path: 'events', component: EventsTabComponent },
          { path: 'ssh', component: SshTabComponent }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [
    CreateApplicationModule,
    RouterModule.forChild(appplicationsRoutes)

  ]
})
export class ApplicationsRoutingModule { }
