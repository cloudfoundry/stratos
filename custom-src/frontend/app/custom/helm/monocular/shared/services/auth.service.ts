import { Injectable } from '@angular/core';
import { Observable, of as ObservableOf } from 'rxjs';

/* TODO, This is a mocked class. */
// TODO: RC Q This isn't used anywhere, is it needed?
@Injectable()
export class AuthService {

  constructor() { }

  /**
   * Check if logged in on the API server
   *
   * @return An observable boolean that will be true if logged in or if auth is disabled
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
