import { Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Params, RouteReuseStrategy, RouterStateSnapshot } from '@angular/router';
import { DefaultRouterStateSerializer, RouterStateSerializer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { Store } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { debounceTime, filter, withLatestFrom } from 'rxjs/operators';

import { SetRecentlyVisitedEntityAction } from '../../store/src/actions/recently-visited.actions';
import { GeneralEntityAppState, GeneralRequestDataState } from '../../store/src/app-state';
import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { entityCatalog } from '../../store/src/entity-catalog/entity-catalog';
import { EntityCatalogHelper } from '../../store/src/entity-catalog/entity-catalog-entity/entity-catalog.service';
import { EntityCatalogHelpers } from '../../store/src/entity-catalog/entity-catalog.helper';
import { FavoritesConfigMapper } from '../../store/src/favorite-config-mapper';
import { endpointEntityType, STRATOS_ENDPOINT_TYPE } from '../../store/src/helpers/stratos-entity-factory';
import { getAPIRequestDataState, selectEntity } from '../../store/src/selectors/api.selectors';
import { internalEventStateSelector } from '../../store/src/selectors/internal-events.selectors';
import { recentlyVisitedSelector } from '../../store/src/selectors/recently-visitied.selectors';
import { AppStoreModule } from '../../store/src/store.module';
import { stratosEntityCatalog } from '../../store/src/stratos-entity-catalog';
import { generateStratosEntities } from '../../store/src/stratos-entity-generator';
import { EndpointModel } from '../../store/src/types/endpoint.types';
import { IFavoriteMetadata, UserFavorite } from '../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../store/src/user-favorite-manager';
import { TabNavService } from '../tab-nav.service';
import { XSRFModule } from '../xsrf.module';
import { AppComponent } from './app.component';
import { RouteModule } from './app.routing';
import { CoreModule } from './core/core.module';
import { CustomizationService } from './core/customizations.types';
import { DynamicExtensionRoutes } from './core/extension/dynamic-extension-routes';
import { ExtensionService } from './core/extension/extension-service';
import { getGitHubAPIURL, GITHUB_API_URL } from './core/github.helpers';
import { CurrentUserPermissionsService } from './core/permissions/current-user-permissions.service';
import { CustomImportModule } from './custom-import.module';
import { environment } from './environments/environment';
import { AboutModule } from './features/about/about.module';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { HomeModule } from './features/home/home.module';
import { LoginModule } from './features/login/login.module';
import { NoEndpointsNonAdminComponent } from './features/no-endpoints-non-admin/no-endpoints-non-admin.component';
import { SetupModule } from './features/setup/setup.module';
import { LoggedInService } from './logged-in.service';
import { CustomReuseStrategy } from './route-reuse-stragegy';
import { endpointEventKey, GlobalEventData, GlobalEventService } from './shared/global-events.service';
import { SidePanelService } from './shared/services/side-panel.service';
import { SharedModule } from './shared/shared.module';

// Create action for router navigation. See
// - https://github.com/ngrx/platform/issues/68
// - https://github.com/ngrx/platform/issues/201 (https://github.com/ngrx/platform/pull/355)

// https://github.com/ngrx/platform/blob/master/docs/router-store/api.md#custom-router-state-serializer
export interface RouterStateUrl {
  url: string;
  params: Params;
  queryParams: Params;
}
@Injectable()
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

const storeDebugImports = environment.production ? [] : [
  StoreDevtoolsModule.instrument({
    maxAge: 100,
    logOnly: !environment.production
  })
];

@NgModule({
  imports: storeDebugImports
})
class AppStoreDebugModule { }

/**
 * `HttpXsrfTokenExtractor` which retrieves the token from a cookie.
 */

@NgModule({
  declarations: [
    AppComponent,
    NoEndpointsNonAdminComponent,
  ],
  imports: [
    EntityCatalogModule.forFeature(generateStratosEntities),
    RouteModule,
    AppStoreModule,
    AppStoreDebugModule,
    BrowserModule,
    SharedModule,
    BrowserAnimationsModule,
    CoreModule,
    SetupModule,
    LoginModule,
    HomeModule,
    DashboardModule,
    StoreRouterConnectingModule.forRoot({ serializer: DefaultRouterStateSerializer }), // Create action for router navigation
    AboutModule,
    CustomImportModule,
    XSRFModule,
  ],
  providers: [
    CustomizationService,
    TabNavService,
    LoggedInService,
    ExtensionService,
    DynamicExtensionRoutes,
    SidePanelService,
    { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
    { provide: RouterStateSerializer, useClass: CustomRouterStateSerializer }, // Create action for router navigation
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
    CurrentUserPermissionsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    ext: ExtensionService,
    private store: Store<GeneralEntityAppState>,
    eventService: GlobalEventService,
    private userFavoriteManager: UserFavoriteManager,
    private favoritesConfigMapper: FavoritesConfigMapper,
    ech: EntityCatalogHelper
  ) {
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);

    eventService.addEventConfig<boolean>({
      eventTriggered: (state: GeneralEntityAppState) => new GlobalEventData(!state.dashboard.timeoutSession),
      message: 'Timeout session is disabled - this is considered a security risk.',
      key: 'timeoutSessionWarning',
      link: '/user-profile'
    });
    eventService.addEventConfig<boolean>({
      eventTriggered: (state: GeneralEntityAppState) => new GlobalEventData(!state.dashboard.pollingEnabled),
      message: 'Data polling is disabled - you may be seeing out-of-date data throughout the application.',
      key: 'pollingEnabledWarning',
      link: '/user-profile'
    });
    eventService.addEventConfig<{
      count: number,
      endpoint: EndpointModel
    }>({
      eventTriggered: (state: GeneralEntityAppState) => {
        const eventState = internalEventStateSelector(state);
        return Object.entries(eventState.types.endpoint).reduce((res, [eventId, value]) => {
          const backendErrors = value.filter(error => {
            const eventCode = parseInt(error.eventCode, 10);
            return eventCode >= 500;
          });
          if (!backendErrors.length) {
            return res;
          }
          const entityConfig = entityCatalog.getEntity(STRATOS_ENDPOINT_TYPE, endpointEntityType);
          res.push(new GlobalEventData(true, {
            endpoint: selectEntity<EndpointModel>(entityConfig.entityKey, eventId)(state),
            count: backendErrors.length
          }));
          return res;
        }, []);
      },
      message: data => {
        const part1 = data.count > 1 ? `There are ${data.count} errors` : `There is an error`;
        const part2 = data.endpoint ? ` associated with the endpoint '${data.endpoint.name}'` : ` associated with multiple endpoints`;
        return part1 + part2;
      },
      key: data => `${endpointEventKey}-${data.endpoint.guid}`,
      link: data => `/errors/${data.endpoint.guid}`,
      type: 'error'
    });


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

    const allFavs$ = this.userFavoriteManager.getAllFavorites().pipe(
      filter(([groups, favoriteEntities]) => !!groups && !!favoriteEntities)
    );
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

    // This updates the names of any recents
    debouncedApiRequestData$.pipe(
      withLatestFrom(recents$)
    ).subscribe(
      ([entities, recents]) => {
        Object.values(recents).forEach(recentEntity => {
          const mapper = this.favoritesConfigMapper.getMapperFunction(recentEntity);
          const entityKey = entityCatalog.getEntityKey(recentEntity);
          if (entities[entityKey] && entities[entityKey][recentEntity.entityId]) {
            const entity = entities[entityKey][recentEntity.entityId];
            const entityToMetadata = this.favoritesConfigMapper.getEntityMetadata(recentEntity, entity);
            const name = mapper(entityToMetadata).name;
            if (name && name !== recentEntity.name) {
              // Update the entity name
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

  private syncFavorite(favorite: UserFavorite<IFavoriteMetadata>, entities: GeneralRequestDataState) {
    if (favorite) {
      const isEndpoint = (favorite.entityType === endpointEntityType);
      // If the favorite is an endpoint ensure we look in the stratosEndpoint part of the store instead of, for example, cfEndpoint
      const entityKey = isEndpoint ? entityCatalog.getEntityKey({
        ...favorite,
        endpointType: STRATOS_ENDPOINT_TYPE
      }) : entityCatalog.getEntityKey(favorite);
      const entity = entities[entityKey][favorite.entityId || favorite.endpointId];
      if (entity) {
        const newMetadata = this.favoritesConfigMapper.getEntityMetadata(favorite, entity);
        if (this.metadataHasChanged(favorite.metadata, newMetadata)) {
          stratosEntityCatalog.userFavorite.api.updateFavorite({
            ...favorite,
            metadata: newMetadata
          });
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
