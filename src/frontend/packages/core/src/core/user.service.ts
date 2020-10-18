import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthOnlyAppState } from '../../../store/src/app-state';
import { AuthState } from '../../../store/src/reducers/auth.reducer';


@Injectable()
export class UserService {

  isAdmin$: Observable<boolean>;

  constructor(store: Store<AuthOnlyAppState>) {
    this.isAdmin$ = store.select(s => s.auth).pipe(
      map((auth: AuthState) => auth.sessionData && auth.sessionData.user && auth.sessionData.user.admin)
    );
  }

}
