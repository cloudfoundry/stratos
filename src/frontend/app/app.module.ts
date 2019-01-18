import { IFavoriteMetadata } from './store/types/user-favorites.types';
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
import { favoritesConfigMapper } from './shared/components/favorites-meta-card/favorite-config-mapper';
import { EndpointModel } from './store/types/endpoint.types';
import { applicationSchemaKey, endpointSchemaKey, spaceSchemaKey, organizationSchemaKey } from './store/helpers/entity-factory';
import { IApp, ISpace, IOrganization } from './core/cf-api.types';
import { startWith, map, combineLatest, debounceTime } from 'rxjs/operators';
import { ApplicationStateService } from './shared/components/application-state/application-state.service';
import { ApplicationService, createGetApplicationAction } from './features/applications/application.service';
import { Store } from '@ngrx/store';
import { GetAllEndpoints } from './store/actions/endpoint.actions';
import { GetSpace } from './store/actions/space.actions';
import { GetOrganization } from './store/actions/organization.actions';
import { CurrentUserPermissionsService } from './core/current-user-permissions.service';
import { CurrentUserPermissions } from './core/current-user-permissions.config';
import { RouterNav } from './store/actions/router.actions';
import { initEndpointExtensions, getFullEndpointApiUrl } from './features/endpoints/endpoint-helpers';
import { getAPIRequestDataState } from './store/selectors/api.selectors';
import { UserFavoriteManager } from './core/user-favorite-manager';

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
  private userFavoriteManager: UserFavoriteManager;
  constructor(
    ext: ExtensionService,
    private permissionService: CurrentUserPermissionsService,
    private appStateService: ApplicationStateService,
    private store: Store<AppState>,
  ) {
    ext.init();
    // Init Auth Types and Endpoint Types provided by extensions
    initEndpointExtensions(ext);
    // Once the CF modules become an extension point, these should be moved to a CF specific module
    this.registerCfFavoriteMappers();
    this.userFavoriteManager = new UserFavoriteManager(store);
    this.store.select(getAPIRequestDataState)
      .pipe(
        combineLatest(this.userFavoriteManager.getAllFavorites()),
        debounceTime(500)
      )
      .subscribe(
        ([entities, favorites]) => {
          favorites.forEach(fav => {
            console.log(entities[fav.entityType][fav.entityId]);
          });
        }
      );
  }

  private registerCfFavoriteMappers() {
    const endpointType = 'cf';

    this.registerCfEndpointMapper(endpointType);
    this.registerCfApplicationMapper(endpointType);
    this.registerCfSpaceMapper(endpointType);
    this.registerCfOrgMapper(endpointType);
  }
  private registerCfEndpointMapper(endpointType: string) {
    interface IEndpointFavMetadata extends IFavoriteMetadata {
      guid: string;
      address: string;
      user: string;
      admin: string;
    }

    favoritesConfigMapper.registerFavoriteConfig<EndpointModel, IEndpointFavMetadata>({
      endpointType,
      entityType: endpointSchemaKey
    },
      'Cloud Foundry',
      (endpoint: IEndpointFavMetadata) => ({
        type: endpointType,
        routerLink: `/cloud-foundry/${endpoint.guid}`,
        lines: [
          ['Address', endpoint.address],
          ['User', endpoint.user],
          ['Admin', endpoint.admin]
        ],
        name: endpoint.name,
        menuItems: [
          {
            label: 'Deploy application',
            action: () => this.store.dispatch(new RouterNav({ path: ['applications/deploy'], query: { endpointGuid: endpoint.guid } })),
            can: this.permissionService.can(CurrentUserPermissions.APPLICATION_CREATE)
          }
        ]
      }),
      () => new GetAllEndpoints(false),
      endpoint => ({
        guid: endpoint.guid,
        address: getFullEndpointApiUrl(endpoint),
        user: endpoint.user ? endpoint.user.name : undefined,
        admin: endpoint.user ? endpoint.user.admin ? 'Yes' : 'No' : undefined
      })
    );
  }
  private registerCfApplicationMapper(endpointType: string) {

    interface IAppFavMetadata extends IFavoriteMetadata {
      guid: string;
      cfGuid: string;
      name: string;
    }

    favoritesConfigMapper.registerFavoriteConfig<APIResource<IApp>, IAppFavMetadata>({
      endpointType,
      entityType: applicationSchemaKey
    },
      'Application',
      (app: IAppFavMetadata) => {
        return {
          type: applicationSchemaKey,
          routerLink: `/applications/${app.cfGuid}/${app.guid}/summary`,
          name: app.name,
          lines: []
        };
      },
      favorite => createGetApplicationAction(favorite.entityId, favorite.endpointId),
      app => ({
        guid: app.metadata.guid,
        cfGuid: app.entity.cfGuid,
        name: app.entity.name,
      })
    );
  }
  private registerCfSpaceMapper(endpointType: string) {

    interface ISpaceFavMetadata extends IFavoriteMetadata {
      guid: string;
      orgGuid: string;
      name: string;
      cfGuid: string;
    }

    favoritesConfigMapper.registerFavoriteConfig<APIResource<ISpace>, ISpaceFavMetadata>({
      endpointType,
      entityType: spaceSchemaKey
    },
      'Space',
      (space: ISpaceFavMetadata) => {
        return {
          type: spaceSchemaKey,
          routerLink: `/cloud-foundry/${space.cfGuid}/organizations/${space.orgGuid}/spaces/${space.guid}/summary`,
          lines: [],
          name: space.name
        };
      },
      favorite => new GetSpace(favorite.entityId, favorite.endpointId),
      space => ({
        guid: space.metadata.guid,
        orgGuid: space.entity.organization_guid ? space.entity.organization_guid : space.entity.organization.metadata.guid,
        name: space.entity.name,
        cfGuid: space.entity.cfGuid,
      })
    );

  }
  private registerCfOrgMapper(endpointType: string) {
    interface IOrgFavMetadata extends IFavoriteMetadata {
      guid: string;
      status: string;
      name: string;
      cfGuid: string;
    }

    favoritesConfigMapper.registerFavoriteConfig<APIResource<IOrganization>, IOrgFavMetadata>({
      endpointType,
      entityType: organizationSchemaKey
    },
      'Organization',
      (org: IOrgFavMetadata) => ({
        type: organizationSchemaKey,
        routerLink: `/cloud-foundry/${org.cfGuid}/organizations/${org.guid}`,
        lines: [
          ['Status', org.status]
        ],
        name: org.name
      }),
      favorite => new GetOrganization(favorite.entityId, favorite.endpointId),
      org => ({
        guid: org.metadata.guid,
        status: this.getOrgStatus(org),
        name: org.entity.name,
        cfGuid: org.entity.cfGuid,
      })
    );
  }
  private getOrgStatus(org: APIResource<IOrganization>) {
    if (!org || !org.entity || !org.entity.status) {
      return 'Unknown';
    }
    return org.entity.status.charAt(0).toUpperCase() + org.entity.status.slice(1);
  }
}
