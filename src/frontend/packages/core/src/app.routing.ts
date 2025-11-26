import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';

import { apiKeyAuthGuard } from './core/apiKey-auth-guard.service';
import { authGuard } from './core/auth-guard.service';
import { CoreModule } from './core/core.module';
import { endpointsGuard } from './core/endpoints.service';
import { notSetupGuard } from './core/not-setup-guard.service';
import { PageNotFoundComponentComponent } from './core/page-not-found-component/page-not-found-component.component';
import { CustomRoutingImportModule } from './custom-import.module';
import { DashboardBaseComponent } from './features/dashboard/dashboard-base/dashboard-base.component';
import { HomePageComponent } from './features/home/home/home-page.component';
import { LoginPageComponent } from './features/login/login-page/login-page.component';
import { LogoutPageComponent } from './features/login/logout-page/logout-page.component';
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
    canActivate: [notSetupGuard],
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
  {
    path: 'login',
    children: [
      {
        path: '',
        component: LoginPageComponent
      },
      {
        path: 'logout',
        component: LogoutPageComponent
      },
    ]
  },
  {
    path: '',
    component: DashboardBaseComponent,
    canActivate: [authGuard, endpointsGuard],
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
          loadChildren: () => import('./features/metrics/metrics.routes').then(m => m.METRICS_ROUTES),
        },
        {
          path: '',
          loadChildren: () => import('./features/endpoints/endpoints.routes').then(m => m.ENDPOINTS_ROUTES),
        }]
      },
      { path: 'about', loadChildren: () => import('./features/about/about.routes').then(m => m.ABOUT_ROUTES) },
      { path: 'user-profile', loadChildren: () => import('./features/user-profile/user-profile.routes').then(m => m.USER_PROFILE_ROUTES) },
      {
        path: 'api-keys',
        loadChildren: () => import('./features/api-keys/api-keys.routes').then(m => m.API_KEYS_ROUTES),
        canActivate: [apiKeyAuthGuard]
      },
      { path: 'events', loadChildren: () => import('./features/event-page/event-page.routes').then(m => m.EVENT_PAGE_ROUTES) },
      {
        path: 'errors/:endpointId',
        loadChildren: () => import('./features/error-page/error-page.routes').then(m => m.ERROR_PAGE_ROUTES)
      },
    ]
  },
  {
    path: 'noendpoints',
    component: NoEndpointsNonAdminComponent,
    canActivate: [authGuard],
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
