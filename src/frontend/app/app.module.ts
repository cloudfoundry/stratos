import { ServiceCatalogModule } from './features/service-catalog/service-catalog.module';
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
import { Params, RouterStateSnapshot } from '@angular/router';
import { RouterStateSerializer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { NoEndpointsNonAdminComponent } from './features/no-endpoints-non-admin/no-endpoints-non-admin.component';

// Create action for router navigation. See
// - https://github.com/ngrx/platform/issues/68
// - https://github.com/ngrx/platform/issues/201 (https://github.com/ngrx/platform/pull/355)

// https://github.com/ngrx/platform/blob/master/docs/router-store/api.md#custom-router-state-serializer
export interface RouterStateUrl {
  url: string;
  params: Params;
  queryParams: Params;
}
export class CustomRouterStateSerializer
  implements RouterStateSerializer<RouterStateUrl> {
  serialize(routerState: RouterStateSnapshot): RouterStateUrl {
    let route = routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const { url } = routerState;
    const queryParams = routerState.root.queryParams;
    const params = route.params;

    // Only return an object including the URL, params and query params
    // instead of the entire snapshot
    return { url, params, queryParams };
  }
}

@NgModule({
  declarations: [
    AppComponent,
    NoEndpointsNonAdminComponent,
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
    ServiceCatalogModule,
    StoreRouterConnectingModule // Create action for router navigation
  ],
  providers: [
    LoggedInService,
    { provide: RouterStateSerializer, useClass: CustomRouterStateSerializer } // Create action for router navigation
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
