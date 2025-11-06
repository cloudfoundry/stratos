import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectSessionData, GeneralEntityAppState } from '@stratosui/store';
import { UserEndpointsEnabled } from 'src/frontend/packages/store/src/types/auth.types';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private store = inject(Store<GeneralEntityAppState>);

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
