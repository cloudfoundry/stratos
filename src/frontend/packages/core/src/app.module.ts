import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Params, RouteReuseStrategy, RouterStateSnapshot } from '@angular/router';
import { RouterStateSerializer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { Store } from '@ngrx/store';
import { debounceTime, withLatestFrom } from 'rxjs/operators';

import { GetAllEndpoints } from '../../store/src/actions/endpoint.actions';
import { GetOrganization } from '../../store/src/actions/organization.actions';
import { SetRecentlyVisitedEntityAction } from '../../store/src/actions/recently-visited.actions';
import { RouterNav } from '../../store/src/actions/router.actions';
import { GetSpace } from '../../store/src/actions/space.actions';
import {
  UpdateUserFavoriteMetadataAction,
} from '../../store/src/actions/user-favourites-actions/update-user-favorite-metadata-action';
import { AppState } from '../../store/src/app-state';
import {
  applicationSchemaKey,
  endpointSchemaKey,
  organizationSchemaKey,
  spaceSchemaKey,
} from '../../store/src/helpers/entity-factory';
import { getAPIRequestDataState } from '../../store/src/selectors/api.selectors';
import { recentlyVisitedSelector } from '../../store/src/selectors/recently-visitied.selectors';
import { AppStoreModule } from '../../store/src/store.module';
import { APIResource } from '../../store/src/types/api.types';
import { EndpointModel } from '../../store/src/types/endpoint.types';
import { IRequestDataState } from '../../store/src/types/entity.types';
import { IEndpointFavMetadata, IFavoriteMetadata, UserFavorite } from '../../store/src/types/user-favorites.types';
import { AppComponent } from './app.component';
import { RouteModule } from './app.routing';
import { IAppFavMetadata, IOrgFavMetadata, ISpaceFavMetadata } from './cf-favourite-types';
import { IApp, IOrganization, ISpace } from './core/cf-api.types';
import { CoreModule } from './core/core.module';
import { CurrentUserPermissions } from './core/current-user-permissions.config';
import { CurrentUserPermissionsService } from './core/current-user-permissions.service';
import { DynamicExtensionRoutes } from './core/extension/dynamic-extension-routes';
import { ExtensionService } from './core/extension/extension-service';
import { getGitHubAPIURL, GITHUB_API_URL } from './core/github.helpers';
import { UserFavoriteManager } from './core/user-favorite-manager';
import { CustomImportModule } from './custom-import.module';
import { AboutModule } from './features/about/about.module';
import { createGetApplicationAction } from './features/applications/application.service';
import { ApplicationsModule } from './features/applications/applications.module';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { getFullEndpointApiUrl, initEndpointExtensions } from './features/endpoints/endpoint-helpers';
import { HomeModule } from './features/home/home.module';
import { LoginModule } from './features/login/login.module';
import { NoEndpointsNonAdminComponent } from './features/no-endpoints-non-admin/no-endpoints-non-admin.component';
import { ServiceCatalogModule } from './features/service-catalog/service-catalog.module';
import { SetupModule } from './features/setup/setup.module';
import { LoggedInService } from './logged-in.service';
import { CustomReuseStrategy } from './route-reuse-stragegy';
import { ApplicationStateService } from './shared/components/application-state/application-state.service';
import { favoritesConfigMapper } from './shared/components/favorites-meta-card/favorite-config-mapper';
import { SharedModule } from './shared/shared.module';
import { XSRFModule } from './xsrf.module';
import { LoggerService } from './core/logger.service';

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
    { provide: RouterStateSerializer, useClass: CustomRouterStateSerializer }, // Create action for router navigation
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy }
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
    private logger: LoggerService
  ) {
    ext.init();
    // Init Auth Types and Endpoint Types provided by extensions
    initEndpointExtensions(ext);
    // Once the CF modules become an extension point, these should be moved to a CF specific module
    this.registerCfFavoriteMappers();
    this.userFavoriteManager = new UserFavoriteManager(store,  logger);
    const allFavs$ = this.userFavoriteManager.getAllFavorites();
    const recents$ = this.store.select(recentlyVisitedSelector);
    const debouncedApiRequestData$ = this.store.select(getAPIRequestDataState).pipe(debounceTime(2000));
    debouncedApiRequestData$.pipe(
      withLatestFrom(allFavs$)
    ).subscribe(
      ([entities, [favoriteGroups, favorites]]) => {
        Object.keys(favoriteGroups).forEach(endpointId => {
          const favoriteGroup = favoriteGroups[endpointId];
          if (!favoriteGroup.ethereal) {
            const endpointFavorite = favorites[endpointId];
            this.syncFavorite(endpointFavorite, entities);
          }
          favoriteGroup.entitiesIds.forEach(id => {
            const favorite = favorites[id];
            this.syncFavorite(favorite, entities);
          });
        });
      }
    );

    debouncedApiRequestData$.pipe(
      withLatestFrom(recents$)
    ).subscribe(
      ([entities, recents]) => {
        Object.values(recents.entities).forEach(recentEntity => {
          const mapper = favoritesConfigMapper.getMapperFunction(recentEntity);
          if (entities[recentEntity.entityType] && entities[recentEntity.entityType][recentEntity.entityId]) {
            const entity = entities[recentEntity.entityType][recentEntity.entityId];
            const entityToMetadata = favoritesConfigMapper.getEntityMetadata(recentEntity, entity);
            const name = mapper(entityToMetadata).name;
            if (name && name !== recentEntity.name) {
              this.store.dispatch(new SetRecentlyVisitedEntityAction({
                ...recentEntity,
                name
              }));
            }
          }
        });
      }
    );
  }

  private syncFavorite(favorite: UserFavorite<IFavoriteMetadata>, entities: IRequestDataState) {
    if (favorite) {
      const entity = entities[favorite.entityType][favorite.entityId || favorite.endpointId];
      if (entity) {
        const newMetadata = favoritesConfigMapper.getEntityMetadata(favorite, entity);
        if (this.metadataHasChanged(favorite.metadata, newMetadata)) {
          this.store.dispatch(new UpdateUserFavoriteMetadataAction({
            ...favorite,
            metadata: newMetadata
          }));
        }
      }
    }
  }

  private metadataHasChanged(oldMeta: IFavoriteMetadata, newMeta: IFavoriteMetadata) {
    if ((!oldMeta && newMeta) || (oldMeta && !newMeta)) {
      return true;
    }
    const oldKeys = Object.keys(oldMeta);
    const newKeys = Object.keys(newMeta);
    const oldValues = Object.values(oldMeta);
    const newValues = Object.values(newMeta);
    if (oldKeys.length !== newKeys.length) {
      return true;
    }
    if (oldKeys.sort().join(',') !== newKeys.sort().join(',')) {
      return true;
    }
    if (oldValues.sort().join(',') !== newValues.sort().join(',')) {
      return true;
    }
    return false;
  }

  private registerCfFavoriteMappers() {
    const endpointType = 'cf';

    this.registerCfEndpointMapper(endpointType);
    this.registerCfApplicationMapper(endpointType);
    this.registerCfSpaceMapper(endpointType);
    this.registerCfOrgMapper(endpointType);
  }
  private registerCfEndpointMapper(endpointType: string) {
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
        name: endpoint.name,
        guid: endpoint.guid,
        address: getFullEndpointApiUrl(endpoint),
        user: endpoint.user ? endpoint.user.name : undefined,
        admin: endpoint.user ? endpoint.user.admin ? 'Yes' : 'No' : undefined
      })
    );
  }

  private registerCfApplicationMapper(endpointType: string) {
    favoritesConfigMapper.registerFavoriteConfig<APIResource<IApp>, IAppFavMetadata>({
      endpointType,
      entityType: applicationSchemaKey
    },
      'Application',
      (app: IAppFavMetadata) => {
        return {
          type: applicationSchemaKey,
          routerLink: `/applications/${app.cfGuid}/${app.guid}/summary`,
          name: app.name
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
    favoritesConfigMapper.registerFavoriteConfig<APIResource<ISpace>, ISpaceFavMetadata>({
      endpointType,
      entityType: spaceSchemaKey
    },
      'Space',
      (space: ISpaceFavMetadata) => {
        return {
          type: spaceSchemaKey,
          routerLink: `/cloud-foundry/${space.cfGuid}/organizations/${space.orgGuid}/spaces/${space.guid}/summary`,
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

    favoritesConfigMapper.registerFavoriteConfig<APIResource<IOrganization>, IOrgFavMetadata>({
      endpointType,
      entityType: organizationSchemaKey
    },
      'Organization',
      (org: IOrgFavMetadata) => ({
        type: organizationSchemaKey,
        routerLink: `/cloud-foundry/${org.cfGuid}/organizations/${org.guid}`,
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

