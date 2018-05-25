import { AfterContentInit, Component, HostBinding, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';

import { environment } from '../environments/environment';
import { ExtensionManager } from './core/extension/extension-manager-service';
import { initEndpointTypes } from './features/endpoints/endpoint-helpers';
import { LoggedInService } from './logged-in.service';
import { AppState } from './store/app-state';

import { create } from 'rxjs-spy';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterContentInit {

  @HostBinding('@.disabled')
  public animationsDisabled = false;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private loggedInService: LoggedInService,
    private ext: ExtensionManager,
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

    // Disable animations for e2e tests
    if (window.sessionStorage.getItem('STRATOS_DISABLE_ANIMATIONS')) {
      this.animationsDisabled = true;
    }

    console.log('Applying extensions');

    // Apply extensions (if any)
    ext.applyRouteConfig();
    initEndpointTypes(ext.getEndpointTypes());
  }
  title = 'app';

  ngOnInit() { }

  ngAfterContentInit() { }
}
