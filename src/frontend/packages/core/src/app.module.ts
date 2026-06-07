import { ApplicationRef, EnvironmentInjector, NgModule, effect, provideZonelessChangeDetection, inject, runInInjectionContext } from '@angular/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';
import { getGitHubAPIURL, GITHUB_API_URL } from '@stratosui/git';
import {
  EntityCatalogModule,
  entityCatalog,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  AppStoreModule,
  generateStratosEntities,
} from '@stratosui/store';
import { StratosThemeModule } from '../../theme/theme.module';
import { filter, take } from 'rxjs/operators';

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
import { GlobalEventService } from './shared/global-events.service';
import { SidePanelService } from './shared/services/side-panel.service';
import { SharedModule } from './shared/shared.module';
import { TabNavService } from './tab-nav.service';
import { provideHttpClient, withInterceptors, HttpXsrfTokenExtractor } from '@angular/common/http';
import { xsrfInterceptor, HttpXsrfHeaderExtractor } from './xsrf.module';
import { cfApiInterceptor } from '@stratosui/cloud-foundry';

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
    // Endpoint backend-error banner events are now derived signal-natively
    // inside GlobalEventService from EndpointErrorEventsService (fed by the
    // signal data layer), replacing the ngrx internalEventStateSelector read
    // that used to live here.


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

    // The favorites/recents display-name refresh (formerly a debounced
    // subscription to the ngrx `requestData` store) is now signal-native and
    // lives in the cards themselves: FreshEntityNameService resolves the fresh
    // name and FavoritesMetaCardComponent / RecentEntitiesComponent persist
    // corrections via UserFavoritesDataService.updateMetadata / recents.set.

    // Configure navigation behavior - hide CF-specific menu items when no CF endpoints are connected
    customizationService.set({
      ...customizationService.get(),
      alwaysShowNavForEndpointTypes: (_epType) => false
    });
  }

}
