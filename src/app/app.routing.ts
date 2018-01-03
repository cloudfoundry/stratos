import { NoEndpointsNonAdminComponent } from './features/no-endpoints-non-admin/no-endpoints-non-admin.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuardService } from './core/auth-guard.service';
import { CoreModule } from './core/core.module';
import { CreateApplicationComponent } from './features/applications/create-application/create-application.component';
import { DashboardBaseComponent } from './features/dashboard/dashboard-base/dashboard-base.component';
import { HomePageComponent } from './features/home/home/home-page.component';
import { ConsoleUaaWizardComponent } from './features/uaa-setup/uaa-wizard/console-uaa-wizard.component';
import { SharedModule } from './shared/shared.module';
import { EndpointsService } from './core/endpoints.service';

const appRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'uaa', component: ConsoleUaaWizardComponent },
  { path: 'login', loadChildren: 'app/features/login/login.module#LoginModule' },
  {
    path: '',
    component: DashboardBaseComponent,
    canActivate: [AuthGuardService, EndpointsService],
    children: [
      { path: 'dashboard', component: HomePageComponent },
      { path: 'applications', loadChildren: 'app/features/applications/applications.module#ApplicationsModule' },
      { path: 'endpoints', loadChildren: 'app/features/endpoints/endpoints.module#EndpointsModule' },
      { path: 'service-catalogue', loadChildren: 'app/features/service-catalogue/service-catalogue.module#ServiceCatalogueModule' },
      { path: 'cloud-foundry', loadChildren: 'app/features/cloud-foundry/cloud-foundry.module#CloudFoundryModule' }
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
