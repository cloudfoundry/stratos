import { DOCUMENT } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, Component, HostBinding, OnDestroy, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthOnlyAppState, ThemeService, VerifySession } from '@stratosui/store';
import { Observable } from 'rxjs';
import { create } from 'rxjs-spy';

import { StratosThemeService } from '../../theme/theme.service';

import { environment } from './environments/environment';
import { LoggedInService } from './logged-in.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy, AfterContentInit {
  private loggedInService = inject(LoggedInService);
  private store = inject<Store<AuthOnlyAppState>>(Store);
  themeService = inject(ThemeService);
  private stratosThemeService = inject(StratosThemeService);
  private document = inject<Document>(DOCUMENT);


  @HostBinding('@.disabled')
  public animationsDisabled = false;
  public userId$: Observable<string>;

  constructor() {
    // Dispatch initial session verification BEFORE routing starts
    // This prevents the authGuard from blocking indefinitely waiting for verifying=false
    this.store.dispatch(new VerifySession());

    // We use the username to key the session storage. We could replace this with the users id?
    this.userId$ = this.store.select(state => state.auth.sessionData && state.auth.sessionData.user ? state.auth.sessionData.user.name : null);
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
