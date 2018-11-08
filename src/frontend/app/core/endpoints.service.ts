
import { combineLatest as observableCombineLatest, Observable } from 'rxjs';

import { withLatestFrom, skipWhile, map, first, filter, tap } from 'rxjs/operators';
import {
  endpointEntitiesSelector,
  endpointStatusSelector,
  endpointsEntityRequestDataSelector
} from '../store/selectors/endpoint.selectors';
import { Injectable } from '@angular/core';
import { EndpointState, EndpointModel, endpointStoreNames } from '../store/types/endpoint.types';
import { Store } from '@ngrx/store';
import { AppState, IRequestEntityTypeState } from '../store/app-state';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService } from './user.service';
import { AuthState } from '../store/reducers/auth.reducer';
import { RouterNav } from '../store/actions/router.actions';


@Injectable()
export class EndpointsService implements CanActivate {

  endpoints$: Observable<IRequestEntityTypeState<EndpointModel>>;
  haveRegistered$: Observable<boolean>;
  haveConnected$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private userService: UserService
  ) {
    this.endpoints$ = store.select(endpointEntitiesSelector);
    this.haveRegistered$ = this.endpoints$.pipe(map(endpoints => !!Object.keys(endpoints).length));
    this.haveConnected$ = this.endpoints$.pipe(map(endpoints =>
      !!Object.values(endpoints).find(endpoint => endpoint.connectionStatus === 'connected' || endpoint.connectionStatus === 'checking')));
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
      ),
      map(([state, haveRegistered, haveConnected, isAdmin]: [[AuthState, EndpointState], boolean, boolean, boolean]) => {
        const [authState] = state;
        if (authState.sessionData.valid) {
          // Redirect to endpoints if there's no connected endpoints
          let redirect: string;
          if (!haveRegistered) {
            redirect = isAdmin ? '/endpoints' : '/noendpoints';
          } else if (!haveConnected) {
            redirect = '/endpoints';
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

  hasMetrics(endpointId: string) {
    return this.store.select(endpointsEntityRequestDataSelector(endpointId)).pipe(
      filter(endpoint => !!endpoint),
      map(endpoint => endpoint.metricsAvailable),
      first()
    );
  }
}
