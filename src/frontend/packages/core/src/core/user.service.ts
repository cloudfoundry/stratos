import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthState, AuthOnlyAppState } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class UserService {

  isAdmin$: Observable<boolean>;

  constructor(store: Store<AuthOnlyAppState>) {
    this.isAdmin$ = store.select(s => s.auth).pipe(
      map((auth: AuthState) => auth.sessionData && auth.sessionData.user && auth.sessionData.user.admin));
  }

}
