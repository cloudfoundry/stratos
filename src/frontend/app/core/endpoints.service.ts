import { cnsisEntitiesSelector, cnsisStatusSelector } from '../store/selectors/cnsis.selectors';
import { Observable } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { CNSISState, CNSISModel, cnsisStoreNames } from '../store/types/cnsis.types';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService } from './user.service';
import { AuthState } from '../store/reducers/auth.reducer';
import { RouterNav } from '../store/actions/router.actions';


@Injectable()
export class EndpointsService implements CanActivate {

  endpoints$: any;
  haveRegistered$: Observable<boolean>;
  haveConnected$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private userService: UserService
  ) {
    this.endpoints$ = store.select(cnsisEntitiesSelector);
    this.haveRegistered$ = this.endpoints$.map(cnsis => !!Object.keys(cnsis).length);
    this.haveConnected$ = this.endpoints$.map(cnsis => Object.values(cnsis).find(cnsi => cnsi.connectionStatus === 'connected'));
  }

  canActivate(route: ActivatedRouteSnapshot, routeState: RouterStateSnapshot): Observable<boolean> {
    // Reroute user to endpoint/no endpoint screens if there are no connected or registered endpoints
    return Observable.combineLatest(
      this.store.select('auth'),
      this.store.select(cnsisStatusSelector)
    )
      .skipWhile(([state, cnsiState]: [AuthState, CNSISState]) => {
        return !state.loggedIn || cnsiState.loading;
      })
      .withLatestFrom(
      this.haveRegistered$,
      this.haveConnected$,
      this.userService.isAdmin$,
    )
      .map(([state, haveRegistered, haveConnected, isAdmin]: [[AuthState, CNSISState], boolean, boolean, boolean]) => {
        const [authState, cnsisState] = state;
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
      });
  }
}
