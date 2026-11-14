import { ApplicationRef, computed, inject, Injectable, Signal } from '@angular/core';
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
import { catchError, filter, map, take } from 'rxjs/operators';

import { endpointHasMetrics } from '../features/endpoints/endpoint-helpers';
import { SessionSignalService } from './signals/session-signal.service';
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
  private appRef = inject(ApplicationRef);

  // Signal reads of the endpoint projections.
  readonly endpoints = this.endpointsSignals.endpoints;
  readonly haveRegistered = this.endpointsSignals.haveRegistered;
  readonly haveConnected = this.endpointsSignals.haveConnected;
  readonly connectedEndpoints = this.endpointsSignals.connectedEndpoints;
  readonly disablePersistenceFeatures = this.endpointsSignals.disablePersistenceFeatures;

  // Observable bridge kept for the Observable connectedEndpointsOfTypes().
  endpoints$: Observable<IRequestEntityTypeState<EndpointModel>>;

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

  // Reads the signal, not endpoints$: toObservable replays what its effect
  // last pushed, which lags a just-reloaded list until the next change
  // detection, so a check right after a reload saw the old connections.
  public checkAllEndpoints() {
    const endpoints = this.endpointsSignals.endpoints();
    Object.keys(endpoints).forEach(guid => this.checkEndpoint(endpoints[guid]));
  }


  hasMetrics(endpointId: string): Observable<boolean> {
    return endpointHasMetrics(endpointId, this.endpointsService);
  }

  // True while no endpoint of the type is connected (or unconnectable).
  noConnectedEndpointOfType(type: string): Signal<boolean> {
    return computed(() => connectedOfType(this.endpointsSignals.endpoints(), type).length === 0);
  }

  connectedEndpointsOfTypes(type: string): Observable<EndpointModel[]> {
    return this.endpoints$.pipe(
      map(ep => connectedOfType(ep, type)),
      catchError((error): Observable<EndpointModel[]> => {
        console.error(`Error getting connected endpoints of type ${type}:`, error);
        return of([]);
      })
    );
  }
}

// The endpoints of a type that are connected, or that never need connecting.
// Types missing from the entity catalog are left out.
function connectedOfType(endpoints: IRequestEntityTypeState<EndpointModel>, type: string): EndpointModel[] {
  return Object.values(endpoints)
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
}

// Functional guard for endpoints check
export const endpointsGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  routeState: RouterStateSnapshot
): Observable<boolean> => {
  const router = inject(Router);
  const endpointsService = inject(EndpointsService);
  const userService = inject(UserService);
  const sessionSignals = inject(SessionSignalService);
  const authSignals = inject(AuthSignalService);
  const endpointStatusSignals = inject(EndpointStatusSignalService);

  // Reroute user to endpoint/no endpoint screens if there are no connected or registered endpoints.
  // Auth + endpoint loading state both sourced from signal services, via
  // observables built once there (toObservable() here leaked per run).
  const guardLogic$ = observableCombineLatest([
    authSignals.auth$,
    endpointStatusSignals.status$
  ]).pipe(
    filter(([state, endpointState]) => {
      // Only proceed when logged in and endpoints are done loading
      return !!state && state.loggedIn && !endpointState.loading;
    }),
    map(([authState]: [any, EndpointStatusState]) => {
      const haveRegistered = endpointsService.haveRegistered();
      const haveConnected = endpointsService.haveConnected();
      const isAdmin = userService.isAdmin();
      const isEndpointAdmin = userService.isEndpointAdmin();
      const disablePersistenceFeatures = endpointsService.disablePersistenceFeatures();

      if (authState.sessionData.valid) {
        // Redirect to endpoints if there's no connected endpoints
        let redirect: string | undefined;
        if (!disablePersistenceFeatures) {
          if (!haveRegistered) {
            redirect = isAdmin || (sessionSignals.userEndpointsEnabled() && isEndpointAdmin) ? '/endpoints' : '/noendpoints';
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
