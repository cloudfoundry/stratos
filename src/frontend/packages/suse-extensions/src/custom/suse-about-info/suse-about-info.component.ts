import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AppState } from '../../../../store/src/app-state';
import { AuthState } from '../../../../store/src/reducers/auth.reducer';
import { SessionData } from '../../../../store/src/types/auth.types';

@Component({
  selector: 'app-suse-about-info',
  templateUrl: './suse-about-info.component.html',
  styleUrls: ['./suse-about-info.component.scss'],
})
export class SuseAboutInfoComponent {

  versionNumber$: Observable<string>;

  constructor(
    store: Store<AppState>
  ) {
    this.versionNumber$ = store.select(s => s.auth).pipe(
      filter(auth => !!(auth && auth.sessionData)),
      map((auth: AuthState) => auth.sessionData),
      map((sessionData: SessionData) => {
        const versionNumber = sessionData.version.proxy_version;
        return versionNumber.split('-')[0];
      })
    );
  }

}
