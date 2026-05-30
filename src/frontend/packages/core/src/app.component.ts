import { DOCUMENT } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, Component, HostBinding, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RoutingHistoryService } from '@stratosui/store';
import { Observable } from 'rxjs';
import { create } from 'rxjs-spy';

import { StratosBrandingService } from '../../theme/stratos-branding.service';

import { AuthSignalService } from './core/signals/auth-signal.service';
import { environment } from './environments/environment';
import { LoggedInService } from './logged-in.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  host: { class: 'flex flex-col flex-1 h-screen min-h-0' },
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy, AfterContentInit {
  private loggedInService = inject(LoggedInService);
  // Eagerly instantiated at bootstrap so it starts recording route history
  // from the first navigation (before any wizard/error route is reached).
  // Without this providedIn:root would lazily create it on first consumer
  // inject, missing the navigation that landed the user on that route and
  // breaking the Cancel/back destination.
  private routingHistory = inject(RoutingHistoryService);
  private authSignals = inject(AuthSignalService);
  branding = inject(StratosBrandingService);
  private document = inject<Document>(DOCUMENT);


  @HostBinding('@.disabled')
  public animationsDisabled = false;
  public userId$: Observable<string>;

  constructor() {
    // Trigger initial session verification BEFORE routing starts
    // This prevents the authGuard from blocking indefinitely waiting for verifying=false
    this.authSignals.verifySession(true, true);

    // We use the username to key the session storage. We could replace this with the users id?
    // Sourced from AuthSignalService rather than a direct store.select.
    this.userId$ = toObservable(computed(() => this.authSignals.sessionData()?.user?.name ?? null));
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

    // Desktop (Electron ?)
    if (environment.desktopMode) {
      this.document.body.classList.add('stratos-desktop');
    }
  }

  ngOnDestroy() {
    this.loggedInService.destroy();
  }

  ngAfterContentInit() { }
}
