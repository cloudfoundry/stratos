import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuardService } from './core/auth-guard.service';
import { CoreModule } from './core/core.module';
import { EndpointsService } from './core/endpoints.service';
import { DashboardBaseComponent } from './features/dashboard/dashboard-base/dashboard-base.component';
import { HomePageComponent } from './features/home/home/home-page.component';
import { NoEndpointsNonAdminComponent } from './features/no-endpoints-non-admin/no-endpoints-non-admin.component';
import { ConsoleUaaWizardComponent } from './features/setup/uaa-wizard/console-uaa-wizard.component';
import { UpgradePageComponent } from './features/setup/upgrade-page/upgrade-page.component';
import { SharedModule } from './shared/shared.module';

const appRoutes: Routes = [
  { path: '', redirectTo: 'applications', pathMatch: 'full' },
  { path: 'uaa', component: ConsoleUaaWizardComponent },
  { path: 'upgrade', component: UpgradePageComponent },
  { path: 'login', loadChildren: 'app/features/login/login.module#LoginModule' },
  {
    path: '',
    component: DashboardBaseComponent,
    canActivate: [AuthGuardService, EndpointsService],
    children: [
      { path: 'dashboard', component: HomePageComponent },
      { path: 'applications', loadChildren: 'app/features/applications/applications.module#ApplicationsModule' },
      {
        path: 'endpoints',
        children: [{
          path: '',
          loadChildren: 'app/features/endpoints/endpoints.module#EndpointsModule',
        },
        {
          path: 'metrics',
          loadChildren: 'app/features/metrics/metrics.module#MetricsModule',
        }]
      },
      { path: 'service-catalog', loadChildren: 'app/features/service-catalog/service-catalog.module#ServiceCatalogModule' },
      { path: 'cloud-foundry', loadChildren: 'app/features/cloud-foundry/cloud-foundry.module#CloudFoundryModule' },
      { path: 'about', loadChildren: 'app/features/about/about.module#AboutModule' },
      { path: 'userProfile', loadChildren: 'app/features/user-profile/user-profile.module#UserProfileModule' },
    ]
  },
  {
    path: 'noendpoints',
    component: NoEndpointsNonAdminComponent,
    canActivate: [AuthGuardService],
  }
];

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    RouterModule.forRoot(appRoutes)
  ]
})
export class RouteModule { }
