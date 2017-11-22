import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { RouteModule } from './app.routing';
import { CoreModule } from './core/core.module';
import { ApplicationsModule } from './features/applications/applications.module';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { HomeModule } from './features/home/home.module';
import { LoginModule } from './features/login/login.module';
import { UAASetupModule } from './features/uaa-setup/uaa-setup.module';
import { SharedModule } from './shared/shared.module';
import { AppStoreModule } from './store/store.module';
import { LoggedInService } from './logged-in.service';
import { StoreRouterConnectingModule, RouterStateSerializer } from '@ngrx/router-store';
import { Params, RouterStateSnapshot } from '@angular/router';

// https://stackoverflow.com/questions/46075374/can-ngrx-router-store-4-be-used-with-ngrx-store-2-2
export interface RouterStateUrl {
  url: string;
  queryParams: Params;
}
export class CustomRouterStateSerializer
  implements RouterStateSerializer<RouterStateUrl> {
  serialize(routerState: RouterStateSnapshot): RouterStateUrl {
    const { url } = routerState;
    const queryParams = routerState.root.queryParams;

    return { url, queryParams };
  }
}

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CoreModule,
    AppStoreModule,
    SharedModule,
    RouteModule,
    ApplicationsModule,
    UAASetupModule,
    LoginModule,
    HomeModule,
    DashboardModule,
    StoreRouterConnectingModule
  ],
  providers: [
    LoggedInService,
    { provide: RouterStateSerializer, useClass: CustomRouterStateSerializer }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
