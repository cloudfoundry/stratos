
import { map } from 'rxjs/operators';
import { AuthState } from '../../../store/src/reducers/auth.reducer';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AuthOnlyAppState } from '../../../store/src/app-state';

@Injectable()
export class UserService {

  isAdmin$: Observable<boolean>;

  constructor(store: Store<AuthOnlyAppState>) {
    this.isAdmin$ = store.select(s => s.auth).pipe(
      map((auth: AuthState) => auth.sessionData && auth.sessionData.user && auth.sessionData.user.admin));
  }

}
