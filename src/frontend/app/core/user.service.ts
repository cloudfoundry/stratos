import { AuthState } from '../store/reducers/auth.reducer';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app-state';

@Injectable()
export class UserService {

  isAdmin$: Observable<boolean>;

  constructor(store: Store<AppState>) {
    this.isAdmin$ = store.select(s => s.auth)
      .map((auth: AuthState) => auth.sessionData && auth.sessionData.user && auth.sessionData.user.admin);
  }

}
