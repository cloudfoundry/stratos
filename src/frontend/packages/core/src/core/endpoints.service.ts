import { ApplicationRef, inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import {
  EndpointsDataService,
  EntityCatalogHelpers,
  IRequestEntityTypeState,
  IEndpointFavMetadata,
  UserFavorite,
  entityCatalog,
  EndpointHealthCheck,
  EndpointModel } from '@stratosui/store';
import { EndpointStatusState } from './signals/endpoint-status-signal.service';
import { combineLatest as observableCombineLatest, Observable, of } from 'rxjs';
import { catchError, filter, map, take, withLatestFrom } from 'rxjs/operators';

import { endpointHasMetricsByAvailable } from '../features/endpoints/endpoint-helpers';
import { SessionService } from '../shared/services/session.service';
import { EndpointHealthChecks } from './endpoints-health-checks';
import { AuthSignalService } from './signals/auth-signal.service';
import { EndpointStatusSignalService } from './signals/endpoint-status-signal.service';
import { EndpointsSignalService } from './signals/endpoints-signal.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class EndpointsService {
  private endpointsService = inject(EndpointsDataService);
  private endpointsSignals = inject(EndpointsSignalService);
  private userService = inject(UserService);
  private endpointHealthChecks = inject(EndpointHealthChecks);
  private sessionService = inject(SessionService);
  private appRef = inject(ApplicationRef);


  endpoints$: Observable<IRequestEntityTypeState<EndpointModel>>;
  haveRegistered$: Observable<boolean>;
  haveConnected$: Observable<boolean>;
  disablePersistenceFeatures$: Observable<boolean>;
  connectedEndpoints$: Observable<EndpointModel[]>;

  static getLinkForEndpoint(endpoint: EndpointModel): string {
    if (!endpoint || !endpoint.cnsi_type || !endpoint.guid) {
      return '';
    }
    try {
      // Defensive: Entity catalog lookup may return null if endpoint type not registered yet
      const catalogEntity = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type);
      if (!catalogEntity) {
        console.warn(
          `Endpoint catalog entity not found for type: ${endpoint.cnsi_type}${endpoint.sub_type ? ', subtype: ' + endpoint.sub_type : ''}. ` +
          `Endpoint type may not be registered yet. Returning empty link.`
        );
        return '';
      }

      // Defensive: Verify entity has required builders before accessing
      if (!catalogEntity.builders?.entityBuilder) {
        console.warn(
          `Endpoint catalog entity found but missing entityBuilder for type: ${endpoint.cnsi_type}. ` +
          `This may indicate an incomplete entity registration.`
        );
        return '';
      }

      const metadata = catalogEntity.builders.entityBuilder.getMetadata(endpoint);
      const fav = new UserFavorite<IEndpointFavMetadata>(
        endpoint.guid,
        endpoint.cnsi_type,
        EntityCatalogHelpers.endpointType,
        undefined, // endpoint favorites have no entity-level id
        metadata
      );
      // getLink() yields null when the entity builder has no link resolver;
      // mirror the other no-link paths in this method by returning ''.
      return fav.getLink() ?? '';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `Error getting link for endpoint ${endpoint.cnsi_type}: ${message}. ` +
        `This is non-fatal but may indicate a catalog initialization issue.`
      );
      return '';
    }
  }

  constructor() {
    // TIMING FIX: Defer entity catalog validation until application is stable
    // This ensures all feature modules (CloudFoundryPackageModule, KubernetesSetupModule, etc.)
    // have completed their entity registration before validation runs.
    // This eliminates "Some common endpoint types not registered" warnings during initialization.
    this.appRef.isStable.pipe(
      filter(stable => stable),
      take(1)
    ).subscribe(() => {
      this.validateEntityCatalog();
    });

    // Observables sourced from the signal-native projection. The signal
    // service already encapsulates the entity-catalog defensive filtering
    // for the connected/registered/persistence projections, so we just
    // adapt to Observable shape here for legacy callers.
    this.endpoints$ = toObservable(this.endpointsSignals.endpoints).pipe(
      catchError((error): Observable<IRequestEntityTypeState<EndpointModel>> => {
        console.error('Error reading endpoints:', error);
        return of({} as IRequestEntityTypeState<EndpointModel>);
      })
    );
    this.haveRegistered$ = toObservable(this.endpointsSignals.haveRegistered).pipe(
      catchError((error): Observable<boolean> => {
        console.error('Error checking registered endpoints:', error);
        return of(false);
      })
    );
    this.connectedEndpoints$ = toObservable(this.endpointsSignals.connectedEndpoints).pipe(
      catchError((error): Observable<EndpointModel[]> => {
        console.error('Error getting connected endpoints:', error);
        return of([]);
      })
    );
    this.haveConnected$ = toObservable(this.endpointsSignals.haveConnected).pipe(
      catchError((error): Observable<boolean> => {
        console.error('Error checking connected endpoints:', error);
        return of(false);
      })
    );
    this.disablePersistenceFeatures$ = toObservable(this.endpointsSignals.disablePersistenceFeatures).pipe(
      catchError((error): Observable<boolean> => {
        console.error('Error checking persistence features:', error);
        return of(false);
      })
    );
  }

  /**
   * Validate entity catalog state at startup
   */
  private validateEntityCatalog(): void {
    try {
      const validation = entityCatalog.validateCatalog();

      if (!validation.valid) {
        console.error('Entity Catalog Validation Failed:', validation.errors);
      }

      // Suppress warnings in test environment to reduce noise
      // The warnings about missing k8s/metrics endpoints are false positives
      // for packages that don't require those endpoint types
      // Test env detection: Vitest exposes window.describe in test-setup.ts
      const isTestEnv = typeof (window as any).describe !== 'undefined';
      if (!isTestEnv && validation.warnings.length > 0) {
        console.warn('Entity Catalog Validation Warnings:', validation.warnings);
      }

      // Entity catalog initialized successfully
    } catch (error) {
      console.error('Error validating entity catalog:', error);
    }
  }

  public registerHealthCheck(healthCheck: EndpointHealthCheck) {
    this.endpointHealthChecks.registerHealthCheck(healthCheck);
  }

  public checkEndpoint(endpoint: EndpointModel) {
    this.endpointHealthChecks.checkEndpoint(endpoint);
  }

  public checkAllEndpoints() {
    this.endpoints$.pipe(
      take(1),
      catchError((error): Observable<IRequestEntityTypeState<EndpointModel>> => {
        console.error('Error checking all endpoints:', error);
        return of({} as IRequestEntityTypeState<EndpointModel>);
      })
    ).subscribe(endpoints => Object.keys(endpoints).forEach(guid => this.checkEndpoint(endpoints[guid])));
  }


  hasMetrics(endpointId: string): Observable<boolean> {
    return endpointHasMetricsByAvailable(this.endpointsService, endpointId);
  }

  doesNotHaveConnectedEndpointType(type: string): Observable<boolean> {
    return this.connectedEndpointsOfTypes(type).pipe(
      map(eps => eps.length === 0),
      catchError((error): Observable<boolean> => {
        console.error(`Error checking for endpoints of type ${type}:`, error);
        return of(true);
      })
    );
  }

  hasConnectedEndpointType(type: string): Observable<boolean> {
    return this.connectedEndpointsOfTypes(type).pipe(
      map(eps => eps.length > 0),
      catchError((error): Observable<boolean> => {
        console.error(`Error checking for endpoints of type ${type}:`, error);
        return of(false);
      })
    );
  }

  connectedEndpointsOfTypes(type: string): Observable<EndpointModel[]> {
    return this.endpoints$.pipe(
      map(ep => {
        return Object.values(ep)
          .filter(endpoint => {
            if (endpoint.cnsi_type !== type) {
              return false;
            }
            try {
              // Defensive: Entity catalog lookup may return null if endpoint type not registered yet
              const epType = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type);
              if (!epType) {
                console.warn(
                  `Endpoint catalog entity not found for type: ${endpoint.cnsi_type}${endpoint.sub_type ? ', subtype: ' + endpoint.sub_type : ''}. ` +
                  `Excluding from results until type is registered.`
                );
                return false;
              }

              // Defensive: Verify definition exists before accessing properties
              if (!epType.definition) {
                console.warn(
                  `Endpoint definition missing for type: ${endpoint.cnsi_type}. ` +
                  `This may indicate an incomplete entity registration.`
                );
                return false;
              }

              return epType.definition.unConnectable || endpoint.connectionStatus === 'connected';
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              console.warn(
                `Error checking endpoint type ${endpoint.cnsi_type}: ${message}. ` +
                `Excluding from results.`
              );
              return false;
            }
          });
      }),
      catchError((error): Observable<EndpointModel[]> => {
        console.error(`Error getting connected endpoints of type ${type}:`, error);
        return of([]);
      })
    );
  }
}

// Functional guard for endpoints check
export const endpointsGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  routeState: RouterStateSnapshot
): Observable<boolean> => {
  const router = inject(Router);
  const endpointsService = inject(EndpointsService);
  const userService = inject(UserService);
  const sessionService = inject(SessionService);
  const authSignals = inject(AuthSignalService);
  const endpointStatusSignals = inject(EndpointStatusSignalService);

  // Reroute user to endpoint/no endpoint screens if there are no connected or registered endpoints.
  // Auth + endpoint loading state both sourced from signal services.
  const guardLogic$ = observableCombineLatest(
    toObservable(authSignals.auth),
    toObservable(endpointStatusSignals.status)
  ).pipe(
    filter(([state, endpointState]) => {
      // Only proceed when logged in and endpoints are done loading
      return !!state && state.loggedIn && !endpointState.loading;
    }),
    withLatestFrom(
      endpointsService.haveRegistered$,
      endpointsService.haveConnected$,
      userService.isAdmin$,
      userService.isEndpointAdmin$,
      sessionService.userEndpointsEnabled(),
      endpointsService.disablePersistenceFeatures$
    ),
    map(([state, haveRegistered, haveConnected, isAdmin, isEndpointAdmin, userEndpointsEnabled, disablePersistenceFeatures]
      : [[any, EndpointStatusState], boolean, boolean, boolean, boolean, boolean, boolean]) => {
      const [authState] = state;

      if (authState.sessionData.valid) {
        // Redirect to endpoints if there's no connected endpoints
        let redirect: string | undefined;
        if (!disablePersistenceFeatures) {
          if (!haveRegistered) {
            redirect = isAdmin || (userEndpointsEnabled && isEndpointAdmin) ? '/endpoints' : '/noendpoints';
          } else if (!haveConnected) {
            redirect = '/endpoints';
          }
        }

        // Abort redirect if there's no redirect needed (endpoints are ok or we're already heading to redirect)
        if (!redirect || redirect === routeState.url) {
          return true;
        }

        router.navigate([redirect]);
      }

      return false;
    }),
    take(1), // Complete the observable after first emission to prevent router navigation hang
    catchError(error => {
      console.error('Error in endpoints guard:', error);
      return of(true); // Allow navigation on error to prevent blocking
    })
  );

  // No timeout needed - navigation waits for appReady$ in LoginPageComponent,
  // ensuring guards resolve instantly with proper sequential initialization
  return guardLogic$;
};
