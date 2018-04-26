import { AfterContentInit, Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { create } from 'rxjs-spy';

import { environment } from '../environments/environment';
import { LoggedInService } from './logged-in.service';
import { AppState } from './store/app-state';
import { DOCUMENT } from '@angular/platform-browser';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterContentInit {
  constructor(
    private store: Store<AppState>,
    private router: Router,
    private loggedInService: LoggedInService,
    @Inject(DOCUMENT) private document: Document,
  ) {
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

  }
  title = 'app';

  ngOnInit() {
    // Material design defines smaller sizes when on desktop but angular-material uses larger mobile sizes
    // Add a style to the body if we detect a desktop browser, so we can adjust styling to match the MD Specification

    // Approximation for detecting desktop browser - see: Stack Overflow: https://goo.gl/e1KuJR
    const isTouchDevice = function() {  return 'ontouchstart' in window || 'onmsgesturechange' in window; };
    const isDesktop = window.screenX !== 0 && !isTouchDevice() ? true : false;
    if (isDesktop) {
      this.document.body.classList.add('md-desktop');
    }
  }

  ngAfterContentInit() { }
}
