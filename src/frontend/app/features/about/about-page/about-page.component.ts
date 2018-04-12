import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { filter, map } from 'rxjs/operators';
import { SessionData } from '../../../store/types/auth.types';

@Component({
  selector: 'app-about-page',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss']
})
export class AboutPageComponent implements OnInit {

  sessionData$: Observable<SessionData>;
  versionNumber$: Observable<string>;

  constructor(private store: Store<AppState>) { }

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
