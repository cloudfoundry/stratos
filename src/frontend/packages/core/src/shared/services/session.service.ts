import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { GeneralEntityAppState } from '../../../../store/src/app-state';
import { selectSessionData } from '../../../../store/src/reducers/auth.reducer';

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
      map(sessionData => sessionData.config.enableUserEndpoints || false)
    );
  }
}
