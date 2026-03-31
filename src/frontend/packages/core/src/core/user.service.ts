
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthOnlyAppState, AuthState } from '@stratosui/store';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  isAdmin$: Observable<boolean>;
  isEndpointAdmin$: Observable<boolean>;

  constructor() {
    const store = inject<Store<AuthOnlyAppState>>(Store);

    this.isAdmin$ = store.select(s => s.auth).pipe(
      map((auth: AuthState) => auth.sessionData && auth.sessionData.user && auth.sessionData.user.admin));

    this.isEndpointAdmin$ = store.select(s => s.auth).pipe(
      map((auth: AuthState) => {
        return (auth.sessionData
          && auth.sessionData.user
          && auth.sessionData.user.scopes.find(e => e === 'stratos.endpointadmin') !== undefined);
      }));
  }

}
