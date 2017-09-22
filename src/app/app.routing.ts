import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';

import { CoreModule } from './core/core.module';
import { AuthGuardService } from './core/auth-guard.service';

import { EndpointsPageComponent } from './features/endpoints/endpoints-page/endpoints-page.component';

import { RootModule } from './features/root/root.module';
import { ConsoleUaaWizardComponent } from './features/root/console-uaa-wizard/console-uaa-wizard.component';
import { LoginPageComponent } from './features/root/login/login-page.component';
import { DashboardBaseComponent } from './features/root/dashboard-base/dashboard-base.component';
import { HomePageComponent } from './features/root/home-page/home-page.component';
import { SharedModule } from './shared/shared.module';

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
      { path: 'applications', loadChildren: 'app/features/applications/applications.module#ApplicationsModule' },
      { path: 'endpoints', loadChildren: 'app/features/endpoints/endpoints.module#EndpointsModule' }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    RouterModule.forRoot(appRoutes, { preloadingStrategy: PreloadAllModules }),
    RootModule
  ]
})
export class RouteModule { }
