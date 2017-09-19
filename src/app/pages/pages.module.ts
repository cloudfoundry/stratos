import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationResolver } from './application-base/application.resolver';
import { ComponentsModule } from '../components/components.module';
import { ApplicationBaseComponent } from './application-base/application-base.component';
import { SummaryTabComponent } from './application-base/summary-tab/summary-tab.component';
import { LogStreamTabComponent } from './application-base/log-stream-tab/log-stream-tab.component';
import { ServicesTabComponent } from './application-base/services-tab/services-tab.component';
import { VariablesTabComponent } from './application-base/variables-tab/variables-tab.component';
import { EventsTabComponent } from './application-base/events-tab/events-tab.component';
import { SshTabComponent } from './application-base/ssh-tab/ssh-tab.component';

import { MDAppModule } from '../md/md.module';
import { Routes, RouterModule } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { ApplicationWallComponent } from './application-wall/application-wall.component';
import { EndpointsPageComponent } from './endpoints-page/endpoints-page.component';
import { ConsoleUaaWizardComponent } from '../components/console-uaa-wizard/console-uaa-wizard.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { DashboardBaseComponent } from './dashboard-base/dashboard-base.component';
import { AuthGuardService } from '../guards/auth-guard.service';

//TODO: RC split pages into sectional folders with own modules, use loadChildren: 'app/pages/pages.module#PagesModule' & RouterModule.forChild(appRoutes),

const appRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'uaa', component: ConsoleUaaWizardComponent },
  { path: 'login', component: LoginPageComponent },
  {
    path: '',
    component: DashboardBaseComponent,
    canActivate: [AuthGuardService],
    children: [
      { path: 'dashboard', component: HomePageComponent },
      { path: 'applications', component: ApplicationWallComponent },
      {
        path: 'applications/:cfId/:id',
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
      },
      { path: 'endpoints', component: EndpointsPageComponent }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    MDAppModule,
    ComponentsModule,
    RouterModule,
    RouterModule.forRoot(appRoutes),
  ],
  declarations: [
    LoginPageComponent,
    DashboardBaseComponent,
    HomePageComponent,
    ApplicationWallComponent,
    ApplicationBaseComponent,
    SummaryTabComponent,
    LogStreamTabComponent,
    ServicesTabComponent,
    VariablesTabComponent,
    EventsTabComponent,
    SshTabComponent,
    EndpointsPageComponent,
  ],
  exports: [
    RouterModule
  ],
  providers: [
    AuthGuardService,
    ApplicationResolver
  ]
})
export class PagesModule { }
