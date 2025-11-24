import { DOCUMENT } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, Component, HostBinding, Inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthOnlyAppState, ThemeService, VerifySession, entityCatalog } from '@stratosui/store';
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

  @HostBinding('@.disabled')
  public animationsDisabled = false;
  public userId$: Observable<string>;

  constructor(
    private loggedInService: LoggedInService,
    private store: Store<AuthOnlyAppState>,
    public themeService: ThemeService,
    private stratosThemeService: StratosThemeService,
    @Inject(DOCUMENT) private document: Document,
  ) {
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

    // Debug: Log entity catalog state to diagnose fresh clone issues
    console.group('🔍 Entity Catalog Diagnostics');
    const diagnostics = entityCatalog.getDiagnostics();
    console.log('Summary:', diagnostics.summary);
    console.log('Registered Endpoints:', diagnostics.registeredEndpoints);
    console.log('Registered Entities:', diagnostics.registeredEntities);
    console.log('Entities by Endpoint:', diagnostics.entitiesByEndpoint);
    
    // Get all endpoint types available for registration
    const allEndpointTypes = entityCatalog.getAllEndpointTypes(false);
    console.log('Endpoint Types Available for Registration:', allEndpointTypes.map(ep => ({
      type: ep.definition.type,
      label: ep.definition.label,
      subType: ep.definition.subTypes?.map(st => st.type)
    })));
    console.groupEnd();
  }

  ngOnDestroy() {
    this.loggedInService.destroy();
  }

  ngAfterContentInit() { }
}
