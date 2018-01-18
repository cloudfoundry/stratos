import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ApplicationWallComponent } from './application-wall/application-wall.component';
import { ApplicationBaseComponent } from './application/application-base.component';
import { EventsTabComponent } from './application/application-tabs-base/tabs/events-tab/events-tab.component';
import { LogStreamTabComponent } from './application/application-tabs-base/tabs/log-stream-tab/log-stream-tab.component';
import { ServicesTabComponent } from './application/application-tabs-base/tabs/services-tab/services-tab.component';
import { SshTabComponent } from './application/application-tabs-base/tabs/ssh-tab/ssh-tab.component';
import { BuildTabComponent } from './application/application-tabs-base/tabs/build-tab/build-tab.component';
import { VariablesTabComponent } from './application/application-tabs-base/tabs/variables-tab/variables-tab.component';
import { CreateApplicationComponent } from './create-application/create-application.component';
import { CreateApplicationModule } from './create-application/create-application.module';
import { ApplicationTabsBaseComponent } from './application/application-tabs-base/application-tabs-base.component';

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
        children: [
          {
            path: '',
            component: ApplicationTabsBaseComponent,
            children: [
              { path: '', redirectTo: 'build', pathMatch: 'full' },
              { path: 'build', component: BuildTabComponent },
              { path: 'log-stream', component: LogStreamTabComponent },
              { path: 'services', component: ServicesTabComponent },
              { path: 'variables', component: VariablesTabComponent },
              { path: 'events', component: EventsTabComponent },
              { path: 'ssh', component: SshTabComponent }
            ]
          }
        ]
      },
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
