import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuardService } from './core/auth-guard.service';
import { CoreModule } from './core/core.module';
import { EndpointsService } from './core/endpoints.service';
import { NotSetupGuardService } from './core/not-setup-guard.service';
import { PageNotFoundComponentComponent } from './core/page-not-found-component/page-not-found-component.component';
import { CustomRoutingImportModule } from './custom-import.module';
import { DashboardBaseComponent } from './features/dashboard/dashboard-base/dashboard-base.component';
import { HomePageComponent } from './features/home/home/home-page.component';
import { NoEndpointsNonAdminComponent } from './features/no-endpoints-non-admin/no-endpoints-non-admin.component';
import { DomainMismatchComponent } from './features/setup/domain-mismatch/domain-mismatch.component';
import { LocalAccountWizardComponent } from './features/setup/local-account-wizard/local-account-wizard.component';
import { SetupWelcomeComponent } from './features/setup/setup-welcome/setup-welcome.component';
import { ConsoleUaaWizardComponent } from './features/setup/uaa-wizard/console-uaa-wizard.component';
import { UpgradePageComponent } from './features/setup/upgrade-page/upgrade-page.component';
import { SharedModule } from './shared/shared.module';

const appRoutes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'setup',
    canActivate: [NotSetupGuardService],
    children: [
      {
        path: '',
        component: SetupWelcomeComponent
      },
      {
        path: 'uaa',
        component: ConsoleUaaWizardComponent
      },
      {
        path: 'local',
        component: LocalAccountWizardComponent
      },
    ]
  },
  { path: 'upgrade', component: UpgradePageComponent },
  { path: 'domainMismatch', component: DomainMismatchComponent },
  { path: 'login', loadChildren: () => import('./features/login/login.module').then(m => m.LoginModule) },
  {
    path: '',
    component: DashboardBaseComponent,
    canActivate: [AuthGuardService, EndpointsService],
    children: [
      {
        path: 'home',
        component: HomePageComponent,
        data: {
          stratosNavigation: {
            label: 'Home',
            matIcon: 'home',
            position: 10,
            requiresPersistence: true
          }
        }
      },
      { path: 'entity-list', loadChildren: () => import('./api-driven-views/api-driven-views.module').then(m => m.ApiDrivenViewsModule) },
      {
        path: 'endpoints',
        data: {
          stratosNavigation: {
            label: 'Endpoints',
            matIcon: 'endpoints',
            matIconFont: 'stratos-icons',
            position: 100,
            requiresPersistence: true
          }
        },
        children: [{
          path: 'metrics',
          loadChildren: () => import('./features/metrics/metrics.module').then(m => m.MetricsModule),
        },
        {
          path: '',
          loadChildren: () => import('./features/endpoints/endpoints.module').then(m => m.EndpointsModule),
        }]
      },
      { path: 'about', loadChildren: () => import('./features/about/about.module').then(m => m.AboutModule) },
      { path: 'user-profile', loadChildren: () => import('./features/user-profile/user-profile.module').then(m => m.UserProfileModule) },
      { path: 'events', loadChildren: () => import('./features/event-page/event-page.module').then(m => m.EventPageModule) },
      {
        path: 'errors/:endpointId',
        loadChildren: () => import('./features/error-page/error-page.module').then(m => m.ErrorPageModule)
      },
    ]
  },
  {
    path: 'noendpoints',
    component: NoEndpointsNonAdminComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: '**',
    component: PageNotFoundComponentComponent
  },
];

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    RouterModule.forRoot(appRoutes, { onSameUrlNavigation: 'reload' }),
    CustomRoutingImportModule,
  ]
})
export class RouteModule { }
