import { Component, Inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map } from 'rxjs/operators';
import { Customizations, CustomizationsMetadata } from '../../../core/customizations.types';
import { AppState } from '../../../store/app-state';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { SessionData } from '../../../store/types/auth.types';

@Component({
  selector: 'app-about-page',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss']
})
export class AboutPageComponent implements OnInit {

  sessionData$: Observable<SessionData>;
  versionNumber$: Observable<string>;

  constructor(private store: Store<AppState>, @Inject(Customizations) public customizations: CustomizationsMetadata) { }

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
