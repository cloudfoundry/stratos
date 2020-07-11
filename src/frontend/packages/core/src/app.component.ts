import { DOCUMENT } from '@angular/common';
import { AfterContentInit, Component, HostBinding, Inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { create } from 'rxjs-spy';

import { AuthOnlyAppState } from '../../store/src/app-state';
import { ThemeService } from '../../store/src/theme.service';
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
    store: Store<AuthOnlyAppState>,
    public themeService: ThemeService,
    @Inject(DOCUMENT) private document: Document,
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

    // Material design defines smaller sizes when on desktop but angular-material uses larger mobile sizes
    // Add a style to the body if we detect a desktop browser, so we can adjust styling to match the MD Specification

    // Approximation for detecting desktop browser - see: Stack Overflow: https://goo.gl/e1KuJR
    const isTouchDevice = () => 'ontouchstart' in window || 'onmsgesturechange' in window;
    const isDesktop = window.screenX !== 0 && !isTouchDevice() ? true : false;
    if (isDesktop) {
      this.document.body.classList.add('mat-desktop');
    }
  }

  ngOnDestroy() {
    this.loggedInService.destroy();
  }

  ngAfterContentInit() { }
}
