import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectSessionData, GeneralEntityAppState } from '@stratosui/store';
import { UserEndpointsEnabled } from 'frontend/packages/store/src/types/auth.types';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

@Injectable()
export class SessionService {

  constructor(private store: Store<GeneralEntityAppState>) { }

  isTechPreview(): Observable<boolean> {
    return this.store.select(selectSessionData()).pipe(
      first(),
      map(sessionData => sessionData.config.enableTechPreview || false)
    );
  }

  userEndpointsEnabled(): Observable<boolean> {
    return this.store.select(selectSessionData()).pipe(
      first(),
      map(sessionData => sessionData && sessionData.config.userEndpointsEnabled === UserEndpointsEnabled.ENABLED)
    );
  }

  userEndpointsNotDisabled(): Observable<boolean> {
    return this.store.select(selectSessionData()).pipe(
      first(),
      map(sessionData => sessionData && sessionData.config.userEndpointsEnabled !== UserEndpointsEnabled.DISABLED)
    );
  }
}
