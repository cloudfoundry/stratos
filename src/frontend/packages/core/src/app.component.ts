import { AsyncPipe, CommonModule, DOCUMENT, NgClass } from '@angular/common';
import { type AfterContentInit, ChangeDetectionStrategy, Component, HostBinding, Inject, type OnDestroy, type OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { type AuthOnlyAppState, ThemeService, VerifySession } from '@stratosui/store';
import type { Observable } from 'rxjs';
import { create } from 'rxjs-spy';

import { StratosThemeService } from '../../theme/theme.service';

import { environment } from './environments/environment';
import { LoggedInService } from './logged-in.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AsyncPipe,
    NgClass
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy, AfterContentInit {

  @HostBinding('@.disabled')
  public animationsDisabled = false;
  public userId$: Observable<string>;

  private loggedInService = inject(LoggedInService);
  private store = inject(Store<AuthOnlyAppState>);
  public themeService = inject<ThemeService>(ThemeService);
  private stratosThemeService = inject(StratosThemeService);
  private document = inject(DOCUMENT);

  constructor() {
    // Dispatch initial session verification BEFORE routing starts
    // This prevents the authGuard from blocking indefinitely waiting for verifying=false
    this.store.dispatch(new VerifySession());

    // We use the username to key the session storage. We could replace this with the users id?
    this.userId$ = this.store.select(state => state.auth.sessionData?.user ? state.auth.sessionData.user.name : null);
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

  ngAfterContentInit() {
    // Lifecycle hook - no initialization required
  }
}
