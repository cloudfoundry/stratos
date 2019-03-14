import { Injectable } from '@angular/core';

import { Observable, of as ObservableOf } from 'rxjs';

/* TODO, This is a mocked class. */
@Injectable()
export class AuthService {

  constructor() { }

  /**
   * Check if logged in on the API server
   * 
   * @return {Observable} An observable boolean that will be true if logged in or if auth is disabled
   */
  loggedIn(): Observable<boolean> {
    return ObservableOf(true);
  }

  /**
   * Logs user out
   */
  logout() {
  }
}
