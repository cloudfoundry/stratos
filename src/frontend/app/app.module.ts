import { AppState } from './store/app-state';
import { APIResource } from './store/types/api.types';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Params, RouterStateSnapshot } from '@angular/router';
import { RouterStateSerializer, StoreRouterConnectingModule } from '@ngrx/router-store';

import { AppComponent } from './app.component';
import { RouteModule } from './app.routing';
import { CoreModule } from './core/core.module';
import { DynamicExtensionRoutes } from './core/extension/dynamic-extension-routes';
import { ExtensionService } from './core/extension/extension-service';
import { getGitHubAPIURL, GITHUB_API_URL } from './core/github.helpers';
import { CustomImportModule } from './custom-import.module';
import { AboutModule } from './features/about/about.module';
import { ApplicationsModule } from './features/applications/applications.module';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { HomeModule } from './features/home/home.module';
import { LoginModule } from './features/login/login.module';
import { NoEndpointsNonAdminComponent } from './features/no-endpoints-non-admin/no-endpoints-non-admin.component';
import { ServiceCatalogModule } from './features/service-catalog/service-catalog.module';
import { SetupModule } from './features/setup/setup.module';
import { LoggedInService } from './logged-in.service';
import { SharedModule } from './shared/shared.module';
import { AppStoreModule } from './store/store.module';
import { XSRFModule } from './xsrf.module';
import { favoritesConfigMapper } from './shared/components/favorites-meta-card/favorite-to-card-config-mapper';
import { EndpointModel } from './store/types/endpoint.types';
import { applicationSchemaKey, endpointSchemaKey, spaceSchemaKey, organizationSchemaKey } from './store/helpers/entity-factory';
import { IApp, ISpace, IOrganization } from './core/cf-api.types';
import { startWith, map } from 'rxjs/operators';
import { ApplicationStateService } from './shared/components/application-state/application-state.service';
import { ApplicationService, createGetApplicationAction } from './features/applications/application.service';
import { Store } from '@ngrx/store';
import { GetAllEndpoints } from './store/actions/endpoint.actions';
import { GetSpace } from './store/actions/space.actions';
import { GetOrganization } from './store/actions/organization.actions';

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


/**
 * `HttpXsrfTokenExtractor` which retrieves the token from a cookie.
 */

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
    SetupModule,
    LoginModule,
    HomeModule,
    DashboardModule,
    ServiceCatalogModule,
    StoreRouterConnectingModule, // Create action for router navigation
    AboutModule,
    CustomImportModule,
    XSRFModule,
  ],
  providers: [
    LoggedInService,
    ExtensionService,
    DynamicExtensionRoutes,
    { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
    { provide: RouterStateSerializer, useClass: CustomRouterStateSerializer } // Create action for router navigation
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    ext: ExtensionService,
    private appStateService: ApplicationStateService,
    private store: Store<AppState>
  ) {
    ext.init();
    const endpointType = 'cf';

    favoritesConfigMapper.registerMapper({
      endpointType,
      entityType: endpointSchemaKey
    },
      'Cloud Foundry',
      (endpoint: EndpointModel) => ({
        type: endpointType,
        routerLink: `/cloud-foundry/${endpoint.guid}`,
        lines: [
          ['Address', endpoint.api_endpoint.Host],
          ['User', endpoint.user.name],
          ['Admin', endpoint.user.admin ? 'Yes' : 'No']
        ],
        name: endpoint.name
      }),
      () => new GetAllEndpoints(false)
    );

    favoritesConfigMapper.registerMapper({
      endpointType,
      entityType: applicationSchemaKey
    },
      'Application',
      (app: APIResource<IApp>) => {
        const initState = this.appStateService.get(app.entity, null);
        const appState$ = ApplicationService.getApplicationState(
          this.store,
          this.appStateService,
          app.entity,
          app.metadata.guid,
          app.entity.cfGuid
        ).pipe(
          startWith(initState)
        );
        return {
          getStatus: () => appState$.pipe(
            map(state => state.indicator)
          ),
          type: applicationSchemaKey,
          routerLink: `/applications/${app.entity.cfGuid}/${app.entity.guid}/summary`,
          lines: [
            ['State', appState$.pipe(map(state => state.label))]
          ],
          name: app.entity.name
        };
      },
      favorite => createGetApplicationAction(favorite.entityId, favorite.endpointId)
    );

    favoritesConfigMapper.registerMapper({
      endpointType,
      entityType: spaceSchemaKey
    },
      'Space',
      (space: APIResource<ISpace>) => {
        const orgGuid = space.entity.organization_guid || space.entity.organization.entity.guid;
        return {
          type: spaceSchemaKey,
          routerLink: `/cloud-foundry/${space.entity.cfGuid}/organizations/${orgGuid}/${space.entity.guid}`,
          lines: [
          ],
          name: space.entity.name
        };
      },
      favorite => new GetSpace(favorite.entityId, favorite.endpointId)
    );

    favoritesConfigMapper.registerMapper({
      endpointType,
      entityType: organizationSchemaKey
    },
      'Organization',
      (org: APIResource<IOrganization>) => ({
        type: organizationSchemaKey,
        routerLink: `/cloud-foundry/${org.entity.cfGuid}/organizations/${org.entity.guid}`,
        lines: [
        ],
        name: org.entity.name
      }),
      favorite => new GetOrganization(favorite.entityId, favorite.endpointId)
    );

  }
}
