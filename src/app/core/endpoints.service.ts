import { Observable } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { CNSISState, CNSISModel } from '../store/types/cnsis.types';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService } from './user.service';
import { AuthState } from '../store/reducers/auth.reducer';
import { RouterNav } from '../store/actions/router.actions';

@Injectable()
export class EndpointsService implements CanActivate {

  endpoints$: Observable<CNSISModel[]>;
  haveRegistered$: Observable<boolean>;
  haveConnected$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private userService: UserService, ) {
    this.endpoints$ = store.select(s => s.cnsis).map((cnsis: CNSISState) => cnsis.entities);
    this.haveRegistered$ = this.endpoints$.map(cnsis => !!cnsis.length);
    this.haveConnected$ = this.endpoints$.map(cnsis => !!cnsis.find(cnsi => cnsi.registered));
  }

  canActivate(route: ActivatedRouteSnapshot, routeState: RouterStateSnapshot): Observable<boolean> {
    // Reroute user to endpoint/no endpoint screens if there are no connected or registered endpoints
    return this.store.select('auth')
      .skipWhile((state: AuthState) => {
        return !state.loggedIn && !state.error;
      })
      .withLatestFrom(
      this.haveRegistered$,
      this.haveConnected$,
      this.userService.isAdmin$,
    )
      .map(([state, haveRegistered, haveConnected, isAdmin]: [AuthState, boolean, boolean, boolean]) => {
        if (state.sessionData.valid) {
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
