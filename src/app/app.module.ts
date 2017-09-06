import { AppState } from './store/app-state';
import { environment } from './../environments/environment';
import { AuthGuardService } from './auth-guard.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MDAppModule } from './md/md.module';
import { AuthEffect } from './store/effects/auth.effects';
import { authReducer } from './store/reducers/auth.reducer';
import { HttpModule } from '@angular/http';
import { APIEffect } from './store/effects/api.effects';
import { EffectsModule } from '@ngrx/effects';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ActionReducer, State, StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';

import { apiReducer } from './store/reducers/api.reducer';

import { AppComponent } from './app.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { HomePageComponent } from './home-page/home-page.component';
import { DashboardBaseComponent } from './dashboard-base/dashboard-base.component';

import { storeLogger } from 'ngrx-store-logger';
import { SideNavComponent } from './side-nav/side-nav.component';
import { ConsoleUaaWizardComponent } from './console-uaa-wizard/console-uaa-wizard.component';
import { SteppersComponent } from './steppers/steppers.component';
import { StepComponent } from './step/step.component';
import { StepTitleComponent } from './step-title/step-title.component';

export function logger(reducer): any {
  // default, no options
  return storeLogger()(reducer);
}

export const metaReducers = environment.production ? [] : [logger];

const appRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'uaa', component: ConsoleUaaWizardComponent },
  { path: 'login', component: LoginPageComponent },
  {
    path: 'dashboard',
    component: DashboardBaseComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: '',
        children: [
          { path: '', component: HomePageComponent }
        ],
      }
    ]
  }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginPageComponent,
    HomePageComponent,
    DashboardBaseComponent,
    SideNavComponent,
    ConsoleUaaWizardComponent,
    SteppersComponent,
    StepComponent,
    StepTitleComponent
  ],
  imports: [
    HttpModule,
    BrowserModule,
    FormsModule,
    MDAppModule,
    BrowserAnimationsModule,
    StoreModule.forRoot({
      api: apiReducer,
      auth: authReducer
    }, {
        metaReducers
      }),
    RouterModule.forRoot(
      appRoutes
    ),
    StoreDevtoolsModule.instrument({
      maxAge: 25
    }),
    EffectsModule.forRoot([
      APIEffect,
      AuthEffect
    ])
  ],
  providers: [
    AuthGuardService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
