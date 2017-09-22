import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { ApplicationWallComponent } from './application-wall/application-wall.component';

import { ApplicationBaseComponent } from './application/application-base.component';
import { SummaryTabComponent } from './application/summary-tab/summary-tab.component';
import { LogStreamTabComponent } from './application/log-stream-tab/log-stream-tab.component';
import { ServicesTabComponent } from './application/services-tab/services-tab.component';
import { VariablesTabComponent } from './application/variables-tab/variables-tab.component';
import { EventsTabComponent } from './application/events-tab/events-tab.component';
import { SshTabComponent } from './application/ssh-tab/ssh-tab.component';

const appplicationsRoutes: Routes = [
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
          { path: '', redirectTo: 'summary', pathMatch: 'full' },
          { path: 'summary', component: SummaryTabComponent },
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
    RouterModule.forChild(appplicationsRoutes),
  ]
})
export class ApplicationsRoutingModule { }
