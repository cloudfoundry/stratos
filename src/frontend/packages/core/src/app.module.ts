import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Params, RouteReuseStrategy, RouterStateSnapshot } from '@angular/router';
import { RouterStateSerializer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { Store } from '@ngrx/store';
import { debounceTime, withLatestFrom } from 'rxjs/operators';
import { CloudFoundryModule } from '../../cloud-foundry/src/cloud-foundry.module';
import { SetRecentlyVisitedEntityAction } from '../../store/src/actions/recently-visited.actions';
import { UpdateUserFavoriteMetadataAction } from '../../store/src/actions/user-favourites-actions/update-user-favorite-metadata-action';
import { AppState } from '../../store/src/app-state';
import { getAPIRequestDataState } from '../../store/src/selectors/api.selectors';
import { recentlyVisitedSelector } from '../../store/src/selectors/recently-visitied.selectors';
import { AppStoreModule } from '../../store/src/store.module';
import { IRequestDataState } from '../../store/src/types/entity.types';
import { IFavoriteMetadata, UserFavorite } from '../../store/src/types/user-favorites.types';
import { TabNavService } from '../tab-nav.service';
import { AppComponent } from './app.component';
import { RouteModule } from './app.routing';
import { CoreModule } from './core/core.module';
import { CurrentUserPermissionsService } from './core/current-user-permissions.service';
import { EntityCatalogueService } from './core/entity-catalogue/entity-catalogue.service';
import { DynamicExtensionRoutes } from './core/extension/dynamic-extension-routes';
import { ExtensionService } from './core/extension/extension-service';
import { getGitHubAPIURL, GITHUB_API_URL } from './core/github.helpers';
import { UserFavoriteManager } from './core/user-favorite-manager';
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
import { CustomReuseStrategy } from './route-reuse-stragegy';
import { FavoritesConfigMapper } from './shared/components/favorites-meta-card/favorite-config-mapper';
import { GlobalEventData, GlobalEventService } from './shared/global-events.service';
import { SharedModule } from './shared/shared.module';
import { XSRFModule } from './xsrf.module';
import { AppStoreExtensionsModule } from '../../store/src/store.extensions.module';


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
    CloudFoundryModule,
    AppStoreExtensionsModule,
    AppStoreModule,
    BrowserModule,
    BrowserAnimationsModule,
    CoreModule,
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
    TabNavService,
    LoggedInService,
    ExtensionService,
    DynamicExtensionRoutes,
    { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
    { provide: RouterStateSerializer, useClass: CustomRouterStateSerializer }, // Create action for router navigation
    // { provide: RouteReuseStrategy, useClass: CustomReuseStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    ext: ExtensionService,
    private store: Store<AppState>,
    eventService: GlobalEventService,
    private userFavoriteManager: UserFavoriteManager,
    private favoritesConfigMapper: FavoritesConfigMapper
  ) {
    eventService.addEventConfig<boolean>(
      {
        eventTriggered: (state: AppState) => new GlobalEventData(!state.dashboard.timeoutSession),
        message: 'Timeout session is disabled - this is considered a security risk.',
        key: 'timeoutSessionWarning',
        link: '/user-profile'
      }
    );
    // This should be brought back in in the future
    // eventService.addEventConfig<IRequestEntityTypeState<EndpointModel>, EndpointModel>(
    //   {
    //     selector: (state: AppState) => state.requestData.endpoint,
    //     eventTriggered: (state: IRequestEntityTypeState<EndpointModel>) => {
    //       return Object.values(state).reduce((events, endpoint) => {
    //         if (endpoint.connectionStatus === 'checking') {
    //           events.push(new GlobalEventData(true, endpoint));
    //         }
    //         return events;
    //       }, []);
    //     },
    //     message: (endpoint: EndpointModel) => `Connecting endpoint ${endpoint.name}`,
    //     link: '/endpoints',
    //     key: 'endpoint-connect',
    //     type: 'process'
    //   }
    // );
    ext.init();
    // Init Auth Types and Endpoint Types provided by extensions
    // Once the CF modules become an extension point, these should be moved to a CF specific module

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
          const mapper = this.favoritesConfigMapper.getMapperFunction(recentEntity);
          if (entities[recentEntity.entityType] && entities[recentEntity.entityType][recentEntity.entityId]) {
            const entity = entities[recentEntity.entityType][recentEntity.entityId];
            const entityToMetadata = this.favoritesConfigMapper.getEntityMetadata(recentEntity, entity);
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
        const newMetadata = this.favoritesConfigMapper.getEntityMetadata(favorite, entity);
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
}
