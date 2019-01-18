import { SessionData } from './../../store/types/auth.types';
import { Observable } from 'rxjs';
import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { LoginPageComponent } from '../../features/login/login-page/login-page.component';
import { AppState } from '../../store/app-state';
import { filter, map } from 'rxjs/operators';
import { AuthState } from '../../store/reducers/auth.reducer';

@Component({
  selector: 'app-suse-about-info',
  templateUrl: './suse-about-info.component.html',
  styleUrls: ['./suse-about-info.component.scss'],
  encapsulation: ViewEncapsulation.None
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
