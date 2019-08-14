import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, of } from 'rxjs';
import { filter, first, map, skipWhile, switchMap, withLatestFrom } from 'rxjs/operators';

import { FetchCFCellMetricsPaginatedAction, MetricQueryConfig } from '../../../store/src/actions/metrics.actions';
import { RouterNav } from '../../../store/src/actions/router.actions';
import { EndpointOnlyAppState, IRequestEntityTypeState } from '../../../store/src/app-state';
import { entityFactory } from '../../../store/src/helpers/entity-factory';
import { AuthState } from '../../../store/src/reducers/auth.reducer';
import { getPaginationObservables } from '../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import {
  endpointEntitiesSelector,
  endpointsEntityRequestDataSelector,
  endpointStatusSelector,
} from '../../../store/src/selectors/endpoint.selectors';
import { IMetrics } from '../../../store/src/types/base-metric.types';
import { EndpointModel, EndpointState } from '../../../store/src/types/endpoint.types';
import { EndpointHealthCheck, EndpointHealthChecks } from '../../endpoints-health-checks';
import { PaginationMonitorFactory } from '../shared/monitors/pagination-monitor.factory';
import { MetricQueryType } from '../shared/services/metrics-range-selector.types';
import { entityCatalogue } from './entity-catalogue/entity-catalogue.service';
import { UserService } from './user.service';



@Injectable()
export class EndpointsService implements CanActivate {

  endpoints$: Observable<IRequestEntityTypeState<EndpointModel>>;
  haveRegistered$: Observable<boolean>;
  haveConnected$: Observable<boolean>;
  disablePersistenceFeatures$: Observable<boolean>;

  static getLinkForEndpoint(endpoint: EndpointModel): string {
    if (!endpoint) {
      return '';
    }
    const catalogueEntity = entityCatalogue.getEndpoint(endpoint.cnsi_type, endpoint.sub_type);
    const metadata = catalogueEntity.builders.entityBuilder.getMetadata(endpoint);
    if (catalogueEntity) {
      return catalogueEntity.builders.entityBuilder.getLink(metadata);
    }
    return '';
  }

  constructor(
    private store: Store<EndpointOnlyAppState>,
    private userService: UserService,
    private endpointHealthChecks: EndpointHealthChecks,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.endpoints$ = store.select(endpointEntitiesSelector);
    this.haveRegistered$ = this.endpoints$.pipe(map(endpoints => !!Object.keys(endpoints).length));
    this.haveConnected$ = this.endpoints$.pipe(map(endpoints =>
      !!Object.values(endpoints).find(endpoint => {
        const epType = entityCatalogue.getEndpoint(endpoint.cnsi_type, endpoint.sub_type);
        if (!epType.definition) {
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
    return observableCombineLatest(
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

  hasMetrics(endpointId: string): Observable<boolean> {
    return this.store.select(endpointsEntityRequestDataSelector(endpointId)).pipe(
      filter(endpoint => !!endpoint),
      map(endpoint => endpoint.metricsAvailable),
      first()
    );
  }

  hasCellMetrics(endpointId: string): Observable<boolean> {
    return this.hasMetrics(endpointId).pipe(
      switchMap(hasMetrics => {
        if (!hasMetrics) {
          return of(false);
        }

        // Check that we successfully retrieve some stats. If the metric is unknown an empty list is returned
        const action = new FetchCFCellMetricsPaginatedAction(
          endpointId,
          endpointId,
          new MetricQueryConfig('firehose_value_metric_rep_unhealthy_cell', {}),
          MetricQueryType.QUERY
        );
        return getPaginationObservables<IMetrics>({
          store: this.store,
          action,
          paginationMonitor: this.paginationMonitorFactory.create(
            action.paginationKey,
            entityFactory(action.entityType)
          )
        }).entities$.pipe(
          filter(entities => !!entities && !!entities.length),
          map(entities => !!entities.find(entity => !!entity.data.result.length)),
          first()
        );
      })
    );
  }

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
            const epType = entityCatalogue.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition;
            return endpoint.cnsi_type === type && (epType.unConnectable || endpoint.connectionStatus === 'connected');
          });
      })
    );
  }
}
