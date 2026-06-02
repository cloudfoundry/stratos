import { ApplicationRef, EnvironmentInjector, NgModule, effect, provideZonelessChangeDetection, inject, runInInjectionContext } from '@angular/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';
import { Store } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { getGitHubAPIURL, GITHUB_API_URL } from '@stratosui/git';
import {
  RecentlyVisitedDataService,
  GeneralEntityAppState,
  GeneralRequestDataState,
  EntityCatalogModule,
  entityCatalog,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  endpointEntityType,
  STRATOS_ENDPOINT_TYPE,
  getAPIRequestDataState,
  selectEntity,
  internalEventStateSelector,
  AppStoreModule,
  stratosEntityCatalog,
  generateStratosEntities,
  EndpointModel,
  IFavoriteMetadata,
  UserFavorite,
  UserFavoriteManager,
  setEntityMonitorPollingEnabledSource,
} from '@stratosui/store';
import { StratosThemeModule } from '../../theme/theme.module';
import { debounceTime, filter, take, withLatestFrom } from 'rxjs/operators';

import { AppComponent } from './app.component';
import { RouteModule } from './app.routing';
import { CoreModule } from './core/core.module';
import { CustomizationService } from './core/customizations.types';
import { DynamicExtensionRoutes } from './core/extension/dynamic-extension-routes';
import { ExtensionService } from './core/extension/extension-service';
import { CurrentUserPermissionsService } from './core/permissions/current-user-permissions.service';
import { CustomImportModule } from './custom-import.module';
import { environment } from './environments/environment';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { HomeModule } from './features/home/home.module';
import { LoginModule } from './features/login/login.module';
import { NoEndpointsNonAdminComponent } from './features/no-endpoints-non-admin/no-endpoints-non-admin.component';
import { SetupModule } from './features/setup/setup.module';
import { DashboardDataService } from './core/dashboard-data.service';
import { LoggedInService } from './logged-in.service';
import { CustomReuseStrategy } from './route-reuse-stragegy';
import { endpointEventKey, GlobalEventData, GlobalEventService } from './shared/global-events.service';
import { SidePanelService } from './shared/services/side-panel.service';
import { SharedModule } from './shared/shared.module';
import { TabNavService } from './tab-nav.service';
import { provideHttpClient, withInterceptors, HttpXsrfTokenExtractor } from '@angular/common/http';
import { xsrfInterceptor, HttpXsrfHeaderExtractor } from './xsrf.module';
import { cfApiInterceptor } from '@stratosui/cloud-foundry';

const storeDebugImports = environment.production ? [] : [
  StoreDevtoolsModule.instrument({
    maxAge: 100,
    logOnly: !environment.production,
    connectInZone: true,
    autoPause: true,
    trace: false,
    traceLimit: 75
  })
];

@NgModule({
  imports: storeDebugImports
})
class AppStoreDebugModule { }

/**
 * AppModule - Main application module
 *
 * CRITICAL: Module import order must be preserved for correct entity catalog initialization
 *
 * Entity Registration Flow:
 * 1. EntityCatalogModule.forFeature(generateStratosEntities) - MUST BE FIRST
 *    - Registers core Stratos entities (endpoint, systemInfo, userFavorites, etc.)
 *    - These entities are required by all feature modules
 *    - Registration is SYNCHRONOUS - completes before component constructors
 *
 * 2. Core infrastructure modules (Store, Router, etc.)
 *    - Provide foundational services
 *
 * 3. CustomImportModule - MUST BE LAST
 *    - Dynamically loads feature modules (CF, K8s, Git, Autoscaler, etc.)
 *    - Replaced by webpack at build time with actual feature module imports
 *    - Feature modules register their own entities via EntityCatalogModule.forFeature()
 *
 * Angular guarantees module constructors (including EntityCatalogFeatureModule) complete
 * before any component constructors run, ensuring entities are always registered before access.
 *
 * DO NOT REORDER imports without understanding entity registration dependencies.
 */
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    // Standalone Components
    NoEndpointsNonAdminComponent,
    // Modules
    // CRITICAL: Core Stratos entities MUST register first - required by all feature modules
    EntityCatalogModule.forFeature(generateStratosEntities),
    RouteModule,
    AppStoreModule,
    AppStoreDebugModule,
    BrowserModule,
    SharedModule,
    BrowserAnimationsModule,
    CoreModule,
    StratosThemeModule,
    SetupModule,
    LoginModule,
    HomeModule,
    DashboardModule,
    // CRITICAL: CustomImportModule MUST be last - loads feature modules that depend on core entities
    CustomImportModule,
  ],
  providers: [
    // Enable zoneless change detection (Angular 20+ - Zone.js removed)
    provideZonelessChangeDetection(),
    CustomizationService,
    TabNavService,
    LoggedInService,
    ExtensionService,
    DynamicExtensionRoutes,
    SidePanelService,
    { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
    CurrentUserPermissionsService,
    provideCharts(withDefaultRegisterables()),
    // HTTP Client with functional interceptors (Angular 20 pattern)
    provideHttpClient(
      withInterceptors([xsrfInterceptor, cfApiInterceptor])
    ),
    { provide: HttpXsrfTokenExtractor, useClass: HttpXsrfHeaderExtractor }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  private store = inject<Store<GeneralEntityAppState>>(Store);
  private recents = inject(RecentlyVisitedDataService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private appRef = inject(ApplicationRef);

  constructor() {
    const ext = inject(ExtensionService);
    const eventService = inject(GlobalEventService);
    const ech = inject(EntityCatalogHelper);
    const customizationService = inject(CustomizationService);

    EntityCatalogHelpers.SetEntityCatalogHelper(ech);

    // Validate entity catalog after all modules have loaded and registered their entities
    // This ensures CF, K8s, and other feature modules have completed registration before validation
    this.appRef.isStable.pipe(
      filter(stable => stable),
      take(1)
    ).subscribe(() => {
      try {
        const validation = entityCatalog.validateCatalog();

        if (!validation.valid) {
          console.error('[EntityCatalog] Validation errors:', validation.errors);
        }

        if (validation.warnings.length > 0) {
          console.warn('[EntityCatalog] Validation warnings:', validation.warnings);
        }
      } catch (error) {
        console.error('[EntityCatalog] Error during validation:', error);
      }
    });

    // Signal-driven static warnings — replace the legacy ngrx
    // `state.dashboard.{timeoutSession,pollingEnabled}` event configs.
    const dashboardData = inject(DashboardDataService);
    const envInjector = inject(EnvironmentInjector);

    // Hand the dashboard polling-enabled signal to EntityMonitor so its
    // `.poll()` callers continue to honour the user pref now that the
    // ngrx dashboard slice is gone.
    setEntityMonitorPollingEnabledSource(dashboardData.pollingEnabled, envInjector);

    runInInjectionContext(envInjector, () => {
      effect(() => {
        if (!dashboardData.timeoutSession()) {
          eventService.setStaticEvent('timeoutSessionWarning', {
            key: 'timeoutSessionWarning',
            message: 'Timeout session is disabled - this is considered a security risk.',
            link: '/user-profile',
            type: 'warning',
            stratosStatus: eventService.eventTypeToStratosStatus('warning'),
          });
        } else {
          eventService.setStaticEvent('timeoutSessionWarning', null);
        }
      });
      effect(() => {
        if (!dashboardData.pollingEnabled()) {
          eventService.setStaticEvent('pollingEnabledWarning', {
            key: 'pollingEnabledWarning',
            message: 'Data polling is disabled - you may be seeing out-of-date data throughout the application.',
            link: '/user-profile',
            type: 'warning',
            stratosStatus: eventService.eventTypeToStratosStatus('warning'),
          });
        } else {
          eventService.setStaticEvent('pollingEnabledWarning', null);
        }
      });
    });
    eventService.addEventConfig<{
      count: number,
      endpoint: EndpointModel;
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
          // The `stratos/endpoint` catalog entry no longer exists (the
          // legacy ngrx slice + schema-only catalog placeholder were
          // retired in W36-B/C Wave 5). The store still keys endpoints
          // under the same deterministic entity key, so compute it
          // directly via `buildEntityKey` rather than catalog lookup.
          const endpointEntityKey = EntityCatalogHelpers.buildEntityKey(endpointEntityType, STRATOS_ENDPOINT_TYPE);
          res.push(new GlobalEventData(true, {
            endpoint: selectEntity<EndpointModel>(endpointEntityKey, eventId)(state),
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
    const recents$ = this.recents.state$;
    const debouncedApiRequestData$ = this.store.select(getAPIRequestDataState).pipe(debounceTime(2000));
    debouncedApiRequestData$.pipe(
      withLatestFrom(allFavs$)
    ).subscribe(
      ([entities, [favoriteGroups, favorites]]) => {
        if (!favoriteGroups || !favorites) {
          return;
        }
        Object.keys(favoriteGroups).forEach(endpointId => {
          const favoriteGroup = favoriteGroups[endpointId];
          if (!favoriteGroup || !favoriteGroup.ethereal) {
            const endpointFavorite = favorites[endpointId];
            this.syncFavorite(endpointFavorite, entities);
          }
          if (favoriteGroup?.entitiesIds) {
            favoriteGroup.entitiesIds.forEach(id => {
              const favorite = favorites[id];
              this.syncFavorite(favorite, entities);
            });
          }
        });
      }
    );

    // This updates the names of any recents
    debouncedApiRequestData$.pipe(
      withLatestFrom(recents$)
    ).subscribe(
      ([entities, recents]) => {
        if (!recents || !entities) {
          return;
        }
        Object.values(recents).forEach(recentEntity => {
          if (!recentEntity) {
            return;
          }
          const entityKey = entityCatalog.getEntityKey(recentEntity);
          if (entities[entityKey] && entities[entityKey][recentEntity.entityId]) {
            const entity = entities[entityKey][recentEntity.entityId];
            const entityToMetadata = this.userFavoriteManager.getEntityMetadata(recentEntity, entity);
            const name = entityToMetadata?.name;
            if (name && name !== recentEntity.name) {
              // Update the entity name
              this.recents.set({
                ...recentEntity,
                name
              });
            }
          }
        });
      }
    );

    // Configure navigation behavior - hide CF-specific menu items when no CF endpoints are connected
    customizationService.set({
      ...customizationService.get(),
      alwaysShowNavForEndpointTypes: (_epType) => false
    });
  }

  private syncFavorite(favorite: UserFavorite<IFavoriteMetadata>, entities: GeneralRequestDataState) {
    if (favorite && entities) {
      const isEndpoint = (favorite.entityType === endpointEntityType);
      // If the favorite is an endpoint ensure we look in the stratosEndpoint part of the store instead of, for example, cfEndpoint
      const entityKey = isEndpoint ? entityCatalog.getEntityKey({
        ...favorite,
        endpointType: STRATOS_ENDPOINT_TYPE
      }) : entityCatalog.getEntityKey(favorite);

      if (!entities[entityKey]) {
        return;
      }

      const entity = entities[entityKey][favorite.entityId || favorite.endpointId];
      if (entity) {
        const newMetadata = this.userFavoriteManager.getEntityMetadata(favorite, entity);
        if (this.metadataHasChanged(favorite.metadata, newMetadata)) {
          const fav = this.userFavoriteManager.getUserFavoriteFromObject(favorite);
          fav.metadata = newMetadata;
          stratosEntityCatalog.userFavorite.api.updateFavorite(fav);
        }
      }
    }
  }

  private metadataHasChanged(oldMeta: IFavoriteMetadata, newMeta: IFavoriteMetadata) {
    if ((!oldMeta && newMeta) || (oldMeta && !newMeta)) {
      return true;
    }
    if (!oldMeta && !newMeta) {
      return false;
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
