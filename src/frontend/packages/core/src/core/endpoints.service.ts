import { ApplicationRef, inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  endpointEntitiesSelector,
  endpointStatusSelector,
  EndpointOnlyAppState,
  EntityCatalogHelpers,
  IRequestEntityTypeState,
  IEndpointFavMetadata,
  UserFavorite,
  entityCatalog,
  AuthState,
  RouterNav,
  EndpointHealthCheck,
  EndpointModel,
  EndpointState,
} from '@stratosui/store';
import { combineLatest as observableCombineLatest, Observable, of } from 'rxjs';
import { catchError, filter, first, map, skipWhile, switchMap, take, tap, timeout, withLatestFrom } from 'rxjs/operators';

import { endpointHasMetricsByAvailable } from '../features/endpoints/endpoint-helpers';
import { SessionService } from '../shared/services/session.service';
import { EndpointHealthChecks } from './endpoints-health-checks';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class EndpointsService {

  endpoints$: Observable<IRequestEntityTypeState<EndpointModel>>;
  haveRegistered$: Observable<boolean>;
  haveConnected$: Observable<boolean>;
  disablePersistenceFeatures$: Observable<boolean>;
  connectedEndpoints$: Observable<EndpointModel[]>;

  static getLinkForEndpoint(endpoint: EndpointModel): string {
    if (!endpoint) {
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
        null,
        metadata
      );
      return fav.getLink();
    } catch (error) {
      console.warn(
        `Error getting link for endpoint ${endpoint.cnsi_type}: ${error.message}. ` +
        `This is non-fatal but may indicate a catalog initialization issue.`
      );
      return '';
    }
  }

  constructor(
    private store: Store<EndpointOnlyAppState>,
    private userService: UserService,
    private endpointHealthChecks: EndpointHealthChecks,
    private sessionService: SessionService,
    private appRef: ApplicationRef
  ) {
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

    this.endpoints$ = store.select(endpointEntitiesSelector);
    this.haveRegistered$ = this.endpoints$.pipe(
      map(endpoints => !!Object.keys(endpoints).length),
      catchError((error): Observable<boolean> => {
        console.error('Error checking registered endpoints:', error);
        return of(false);
      })
    );
    // Entity registration is synchronous during module construction, so no need to wait for app stability
    // Navigation will wait for appReady$ in LoginPageComponent, ensuring guards resolve instantly
    this.connectedEndpoints$ = this.endpoints$.pipe(
      map(endpoints =>
        Object.values(endpoints).filter(endpoint => {
          try {
            // Defensive: Entity catalog lookup may return null if endpoint type not registered yet
            const epType = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type);
            if (!epType) {
              console.warn(
                `Endpoint catalog entity not found for ${endpoint.cnsi_type}${endpoint.sub_type ? '/' + endpoint.sub_type : ''}. ` +
                `This endpoint will be excluded from connected endpoints list until its type is registered. ` +
                `Run window.__STRATOS_ENTITY_CATALOG__.getDiagnostics() for details.`
              );
              return false;
            }

            // Defensive: Verify definition exists before accessing properties
            if (!epType.definition) {
              console.warn(
                `Endpoint definition missing for ${endpoint.cnsi_type}${endpoint.sub_type ? '/' + endpoint.sub_type : ''}. ` +
                `This may indicate an incomplete entity registration.`
              );
              return false;
            }

            const epEntity = epType.definition;
            return epEntity.unConnectable || endpoint.connectionStatus === 'connected' || endpoint.connectionStatus === 'checking';
          } catch (error) {
            console.warn(
              `Error filtering endpoint ${endpoint.guid} (${endpoint.cnsi_type}): ${error.message}. ` +
              `Excluding from connected endpoints.`
            );
            return false;
          }
        })
      ),
      catchError((error): Observable<EndpointModel[]> => {
        console.error('Error getting connected endpoints:', error);
        return of([]);
      })
    );
    this.haveConnected$ = this.connectedEndpoints$.pipe(
      map(endpoints => endpoints.length > 0),
      catchError((error): Observable<boolean> => {
        console.error('Error checking connected endpoints:', error);
        return of(false);
      })
    );

    this.disablePersistenceFeatures$ = this.store.select('auth').pipe(
      map((auth) => auth.sessionData &&
        auth.sessionData['plugin-config'] &&
        auth.sessionData['plugin-config'].disablePersistenceFeatures === 'true'
      ),
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

      if (validation.warnings.length > 0) {
        console.warn('Entity Catalog Validation Warnings:', validation.warnings);
      }

      // Log summary in development mode
      if (!(window as any).production) {
        const diagnostics = entityCatalog.getDiagnostics();
        console.log('[EndpointsService] Entity Catalog initialized:', {
          endpoints: diagnostics.summary.totalEndpoints,
          entities: diagnostics.summary.totalEntities,
          registeredEndpoints: diagnostics.registeredEndpoints,
          valid: validation.valid
        });
      }
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
      first(),
      catchError((error): Observable<IRequestEntityTypeState<EndpointModel>> => {
        console.error('Error checking all endpoints:', error);
        return of({} as IRequestEntityTypeState<EndpointModel>);
      })
    ).subscribe(endpoints => Object.keys(endpoints).forEach(guid => this.checkEndpoint(endpoints[guid])));
  }


  hasMetrics(endpointId: string): Observable<boolean> {
    return endpointHasMetricsByAvailable(this.store, endpointId);
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
              console.warn(
                `Error checking endpoint type ${endpoint.cnsi_type}: ${error.message}. ` +
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
  const store = inject(Store<EndpointOnlyAppState>);
  const endpointsService = inject(EndpointsService);
  const userService = inject(UserService);
  const sessionService = inject(SessionService);

  // Reroute user to endpoint/no endpoint screens if there are no connected or registered endpoints
  const guardLogic$ = observableCombineLatest(
    store.select('auth'),
    store.select(endpointStatusSelector)
  ).pipe(
    filter(([state, endpointState]: [AuthState, EndpointState]) => {
      // Only proceed when logged in and endpoints are done loading
      return state.loggedIn && !endpointState.loading;
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
      : [[AuthState, EndpointState], boolean, boolean, boolean, boolean, boolean, boolean]) => {
      const [authState] = state;

      if (authState.sessionData.valid) {
        // Redirect to endpoints if there's no connected endpoints
        let redirect: string;
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

        store.dispatch(new RouterNav({ path: [redirect] }, null));
      }

      return false;
    }),
    first(), // Complete the observable after first emission to prevent router navigation hang
    catchError(error => {
      console.error('Error in endpoints guard:', error);
      return of(true); // Allow navigation on error to prevent blocking
    })
  );

  // No timeout needed - navigation waits for appReady$ in LoginPageComponent,
  // ensuring guards resolve instantly with proper sequential initialization
  return guardLogic$;
};
