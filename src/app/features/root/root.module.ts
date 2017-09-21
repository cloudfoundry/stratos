import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

import { ConsoleUaaWizardComponent } from './console-uaa-wizard/console-uaa-wizard.component';
import { DashboardBaseComponent } from './dashboard-base/dashboard-base.component';
import { LoginPageComponent } from './login/login-page.component';
import { HomePageComponent } from './home-page/home-page.component';


@NgModule({
  imports: [
    CoreModule,
    SharedModule
  ],
  declarations: [
    ConsoleUaaWizardComponent,
    DashboardBaseComponent,
    LoginPageComponent,
    HomePageComponent
  ],
  exports: [
    ConsoleUaaWizardComponent,
    DashboardBaseComponent,
    LoginPageComponent,
    HomePageComponent
  ],
  providers: [
  ]
})
export class RootModule { }
