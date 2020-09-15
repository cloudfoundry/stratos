import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { first, map, skipWhile, withLatestFrom } from 'rxjs/operators';

import { RouterNav } from '../../../store/src/actions/router.actions';
import { EndpointOnlyAppState, IRequestEntityTypeState } from '../../../store/src/app-state';
import { EndpointHealthCheck } from '../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel, entityCatalog } from '../../../store/src/public-api';
import { AuthState } from '../../../store/src/reducers/auth.reducer';
import { endpointEntitiesSelector, endpointStatusSelector } from '../../../store/src/selectors/endpoint.selectors';
import { stratosEntityCatalog } from '../../../store/src/stratos-entity-catalog';
import { EndpointRelationTypes, EndpointState } from '../../../store/src/types/endpoint.types';
import { EndpointHealthChecks } from './endpoints-health-checks';
import { UserService } from './user.service';



@Injectable()
export class EndpointsService implements CanActivate {

  constructor(
    private store: Store<EndpointOnlyAppState>,
    private userService: UserService,
    private endpointHealthChecks: EndpointHealthChecks
  ) {
    this.endpoints$ = store.select(endpointEntitiesSelector);
    this.haveRegistered$ = this.endpoints$.pipe(map(endpoints => !!Object.keys(endpoints).length));
    this.haveConnected$ = this.endpoints$.pipe(map(endpoints =>
      !!Object.values(endpoints).find(endpoint => {
        const epType = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type);
        if (!epType || !epType.definition) {
          return false;
        }
        const epEntity = epType.definition;
        return epEntity.unConnectable ||
          endpoint.connectionStatus === 'connected' ||
          endpoint.connectionStatus === 'checking';
      }))
    );

    this.disablePersistenceFeatures$ = this.store.select('auth').pipe(
      map((auth) => auth.sessionData &&
        auth.sessionData['plugin-config'] &&
        auth.sessionData['plugin-config'].disablePersistenceFeatures === 'true'
      )
    );
  }

  endpoints$: Observable<IRequestEntityTypeState<EndpointModel>>;
  haveRegistered$: Observable<boolean>;
  haveConnected$: Observable<boolean>;
  disablePersistenceFeatures$: Observable<boolean>;

  static getLinkForEndpoint(endpoint: EndpointModel): string {
    if (!endpoint) {
      return '';
    }
    const catalogEntity = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type);
    const metadata = catalogEntity.builders.entityBuilder.getMetadata(endpoint);
    if (catalogEntity) {
      return catalogEntity.builders.entityBuilder.getLink(metadata);
    }
    return '';
  }

  // TODO: RC check where this is used, understand how effects new type. where should it live?
  static hasMetrics(endpointId: string, type: EndpointRelationTypes = EndpointRelationTypes.METRICS_CF): Observable<boolean> {
    return stratosEntityCatalog.endpoint.store.getEntityService(endpointId).waitForEntity$.pipe(
      map(endpoint => endpoint.entity),
      map(endpoint => {
        return endpoint && endpoint.relations ?
          !!endpoint.relations.receives.find(relation => relation.type === type) : false;
      })
    );
    // return endpointHasMetricsByAvailable(this.store, endpointId);
  }

  public registerHealthCheck(healthCheck: EndpointHealthCheck) {
    this.endpointHealthChecks.registerHealthCheck(healthCheck);
  }

  public checkEndpoint(endpoint: EndpointModel) {
    this.endpointHealthChecks.checkEndpoint(endpoint);
  }

  public checkAllEndpoints() {
    this.endpoints$.pipe(first()).subscribe(endpoints => Object.keys(endpoints).forEach(guid => this.checkEndpoint(endpoints[guid])));
  }

  canActivate(route: ActivatedRouteSnapshot, routeState: RouterStateSnapshot): Observable<boolean> {
    // Reroute user to endpoint/no endpoint screens if there are no connected or registered endpoints
    return combineLatest(
      this.store.select('auth'),
      this.store.select(endpointStatusSelector)
    ).pipe(
      skipWhile(([state, endpointState]: [AuthState, EndpointState]) => {
        return !state.loggedIn || endpointState.loading;
      }),
      withLatestFrom(
        this.haveRegistered$,
        this.haveConnected$,
        this.userService.isAdmin$,
        this.disablePersistenceFeatures$
      ),
      map(([state, haveRegistered, haveConnected, isAdmin, disablePersistenceFeatures]
        : [[AuthState, EndpointState], boolean, boolean, boolean, boolean]) => {
        const [authState] = state;
        if (authState.sessionData.valid) {
          // Redirect to endpoints if there's no connected endpoints
          let redirect: string;
          if (!disablePersistenceFeatures) {
            if (!haveRegistered) {
              redirect = isAdmin ? '/endpoints' : '/noendpoints';
            } else if (!haveConnected) {
              redirect = '/endpoints';
            }
          }

          // Abort redirect if there's no redirect needed (endpoints are ok or we're already heading to redirect)
          if (!redirect || redirect === routeState.url) {
            return true;
          }

          this.store.dispatch(new RouterNav({ path: [redirect] }, null));
        }

        return false;
      }));
  }

  // // TODO: RC cf specific code
  // eiriniMetricsProvider(endpointId: string): Observable<EndpointsRelation> {
  //   const eiriniProvider$ = stratosEntityCatalog.endpoint.store.getEntityService(endpointId).waitForEntity$.pipe(
  //     map(em => cfEiriniRelationship(em.entity))
  //   );
  //   return combineLatest([
  //     eiriniEnabled(this.store),
  //     eiriniProvider$
  //   ]).pipe(
  //     map(([eirini, eiriniProvider]) => eirini ? eiriniProvider : null)
  //   );
  // }

  // hasEiriniMetrics(endpointId: string): Observable<boolean> {
  //   return this.eiriniMetricsProvider(endpointId).pipe(
  //     map(eirini => !!eirini)
  //   );
  // }

  doesNotHaveConnectedEndpointType(type: string): Observable<boolean> {
    return this.connectedEndpointsOfTypes(type).pipe(
      map(eps => eps.length === 0)
    );
  }

  hasConnectedEndpointType(type: string): Observable<boolean> {
    return this.connectedEndpointsOfTypes(type).pipe(
      map(eps => eps.length > 0)
    );
  }

  connectedEndpointsOfTypes(type: string): Observable<EndpointModel[]> {
    return this.endpoints$.pipe(
      map(ep => {
        return Object.values(ep)
          .filter(endpoint => {
            if (endpoint.cnsi_type !== type) {
              return;
            }
            const epType = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition;
            return epType.unConnectable || endpoint.connectionStatus === 'connected';
          });
      })
    );
  }
}
