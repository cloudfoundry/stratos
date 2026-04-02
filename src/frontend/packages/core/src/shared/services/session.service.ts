import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectSessionData, GeneralEntityAppState, UserEndpointsEnabled } from '@stratosui/store';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private store = inject(Store<GeneralEntityAppState>);

  isTechPreview(): Observable<boolean> {
    return this.store.select(selectSessionData()).pipe(
      take(1),
      map(sessionData => sessionData.config.enableTechPreview || false)
    );
  }

  userEndpointsEnabled(): Observable<boolean> {
    return this.store.select(selectSessionData()).pipe(
      take(1),
      map(sessionData => sessionData && sessionData.config.userEndpointsEnabled === UserEndpointsEnabled.ENABLED)
    );
  }

  userEndpointsNotDisabled(): Observable<boolean> {
    return this.store.select(selectSessionData()).pipe(
      take(1),
      map(sessionData => sessionData && sessionData.config.userEndpointsEnabled !== UserEndpointsEnabled.DISABLED)
    );
  }
}
