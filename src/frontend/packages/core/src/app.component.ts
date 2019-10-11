import { AfterContentInit, Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { create } from 'rxjs-spy';

import { AuthOnlyAppState } from '../../store/src/app-state';
import { environment } from './environments/environment';
import { LoggedInService } from './logged-in.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterContentInit {

  @HostBinding('@.disabled')
  public animationsDisabled = false;
  public userId$: Observable<string>;

  constructor(
    private loggedInService: LoggedInService,
    store: Store<AuthOnlyAppState>
  ) {
    // We use the username to key the session storage. We could replace this with the users id?
    this.userId$ = store.select(state => state.auth.sessionData && state.auth.sessionData.user ? state.auth.sessionData.user.name : null);
    if (!environment.production) {
      if (environment.showObsDebug || environment.disablePolling) {
        const spy = create();
        if (environment.showObsDebug) {
          // spy.log('entity-obs');
          // spy.log('entity-request-obs');
          spy.log('list-pagination');
          spy.log('list-sort');
          spy.log('local-list');
          spy.log('pageSubObs');
          spy.log('actual-page-obs');
          spy.log('stat-obs');
          // spy.log('list');
        }
        if (environment.disablePolling) {
          spy.pause('poll');
        }
      }
    }

    // Disable animations for e2e tests
    if (window.sessionStorage.getItem('STRATOS_DISABLE_ANIMATIONS')) {
      this.animationsDisabled = true;
    }

  }
  title = 'app';

  ngOnInit() {
    this.loggedInService.init();
  }

  ngOnDestroy() {
    this.loggedInService.destroy();
  }

  ngAfterContentInit() { }
}
