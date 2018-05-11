import { Component, Inject, InjectionToken, OnInit, Optional } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map } from 'rxjs/operators';
import { AppState } from '../../../store/app-state';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { SessionData } from '../../../store/types/auth.types';

// Is there a EULA?
export const EULA_PROVIDER = new InjectionToken<boolean>('eula_enabled');

@Component({
  selector: 'app-about-page',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss']
})
export class AboutPageComponent implements OnInit {

  sessionData$: Observable<SessionData>;
  versionNumber$: Observable<string>;

  constructor(private store: Store<AppState>, @Optional() @Inject(EULA_PROVIDER) public hasEula: boolean) {}

  ngOnInit() {
    this.sessionData$ = this.store.select(s => s.auth).pipe(
      filter(auth => !!(auth && auth.sessionData)),
      map((auth: AuthState) => auth.sessionData)
    );

    this.versionNumber$ = this.sessionData$.pipe(
      map((sessionData: SessionData) => {
        const versionNumber = sessionData.version.proxy_version;
        return versionNumber.split('-')[0];
      })
    );
  }

}
