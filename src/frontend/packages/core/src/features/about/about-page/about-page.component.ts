import { Component, Inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Customizations, CustomizationsMetadata } from '../../../core/customizations.types';
import { SessionData } from '../../../../../store/src/types/auth.types';
import { AppState } from '../../../../../store/src/app-state';
import { AuthState } from '../../../../../store/src/reducers/auth.reducer';

@Component({
  selector: 'app-about-page',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss']
})
export class AboutPageComponent implements OnInit {

  sessionData$: Observable<SessionData>;
  versionNumber$: Observable<string>;
  userIsAdmin$: Observable<boolean>;

  constructor(private store: Store<AppState>, @Inject(Customizations) public customizations: CustomizationsMetadata) { }

  ngOnInit() {
    this.sessionData$ = this.store.select(s => s.auth).pipe(
      filter(auth => !!(auth && auth.sessionData)),
      map((auth: AuthState) => auth.sessionData)
    );

    this.userIsAdmin$ = this.sessionData$.pipe(
      map(session => session.user && session.user.admin)
    );

    this.versionNumber$ = this.sessionData$.pipe(
      map((sessionData: SessionData) => {
        const versionNumber = sessionData.version.proxy_version;
        return versionNumber.split('-')[0];
      })
    );
  }

}
