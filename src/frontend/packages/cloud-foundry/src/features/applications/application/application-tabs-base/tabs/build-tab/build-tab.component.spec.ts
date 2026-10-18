import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { CurrentUserPermissionsService } from '@stratosui/core';
import { getGitHubAPIURL, GITHUB_API_URL } from '@stratosui/git';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateTestApplicationServiceProvider, generateCfStoreModules, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';
import { testSCFEndpointGuid } from '@stratosui/store/testing';
import { AppApplicationActionsService } from '../../../../../../shared/services/application-actions.service';
import { CardAppInstancesComponent } from '../../../../../../shared/components/cards/card-app-instances/card-app-instances.component';
import { AppDetailDataService } from '../../../../app-detail-data.service';
import { BuildTabComponent } from './build-tab.component';
import { ViewBuildpackComponent } from "./view-buildpack/view-buildpack.component";

// Signals a test drives; anything left out keeps the default below.
interface DataSignals {
  stratosProject?: WritableSignal<unknown>;
  app?: WritableSignal<unknown>;
  space?: WritableSignal<unknown>;
}

function makeDataServiceStub({
  stratosProject = signal(null),
  app = signal({ entity: { instances: 1 } }),
  space = signal(undefined),
}: DataSignals = {}) {
  return {
    // Minimal app-detail so the Summary template's `@if (data.appDetail())`
    // block renders (the scale card + accordion both live inside it).
    appDetail: signal({
      app: { guid: 'app-1', state: 'STARTED', createdAt: null, routes: [] },
      pkg: null,
      process: null,
      droplet: null,
      build: null,
    }).asReadonly(),
    app: app.asReadonly(),
    summary: signal(undefined).asReadonly(),
    stats: signal([]).asReadonly(),
    envVars: signal(undefined).asReadonly(),
    space: space.asReadonly(),
    org: signal(undefined).asReadonly(),
    domains: signal([]).asReadonly(),
    loading: signal({ app: false, stats: false, envVars: false, space: false, org: false, domains: false }).asReadonly(),
    errors: signal({ app: null, stats: null, envVars: null, space: null, org: null, domains: null }).asReadonly(),
    running: signal(false).asReadonly(),
    url: signal(null).asReadonly(),
    stratosProject: stratosProject.asReadonly(),
    state: signal({ status: 'UNKNOWN' }).asReadonly(),
    fetching: signal(false).asReadonly(),
    lastPolledAt: signal(null).asReadonly(),
    // Reads exercised by the merged-in InstancesAccordionComponent (its
    // tab-scoped services instantiate when the accordion renders, even
    // while collapsed). Mirrors the accordion's own spec data stub.
    statsFetchedAt: signal(null).asReadonly(),
    usageHistory: signal(new Map()).asReadonly(),
    serviceBindingsCount: signal(0).asReadonly(),
    stratosProjectSource: signal(null).asReadonly(),
    raiseFocusPriority: vi.fn(() => vi.fn()),
    setStatsPollMs: vi.fn(),
    cnsiGuid: 'cnsi-1',
    appGuid: 'app-1',
    refresh: () => Promise.resolve(),
  };
}
describe('BuildTabComponent', () => {
  let component: BuildTabComponent;
  let fixture: ComponentFixture<BuildTabComponent>;

  const appId = '4e4858c4-24ab-4caf-87a8-7703d1da58a0';
  const cfId = testSCFEndpointGuid;

  const configure = (signals: DataSignals = {}) => TestBed.configureTestingModule({
      imports: [
        BuildTabComponent,
        ViewBuildpackComponent,
        ...generateCfStoreModules(),
        HttpClientTestingModule,
      ],
      providers: [
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        // BuildTab reads actions.inFlight() to drive the status-card pulse
        // animation. The mock exposes a readonly Signal so the template
        // binding {{ actions.inFlight() }} resolves without injecting the
        // real action service (which depends on parent-scoped providers).
        {
          provide: AppApplicationActionsService,
          useValue: { inFlight: signal(false).asReadonly() },
        },
        { provide: AppDetailDataService, useFactory: () => makeDataServiceStub(signals) },
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {}
            }
          }
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

  afterEach(() => {
    fixture?.destroy();
  });

  describe('without a deployed project', () => {
    beforeEach(async () => {
      await configure();
      fixture = TestBed.createComponent(BuildTabComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('renders the instances accordion', () => {
      expect(fixture.nativeElement.querySelector('app-instances-accordion')).toBeTruthy();
    });

    it('renders the scale card with actions enabled', () => {
      const card = fixture.debugElement.query(By.directive(CardAppInstancesComponent));
      expect(card).toBeTruthy();
      expect(card.componentInstance.showActions).toBe(true);
    });
  });

  // The repository links bind gitRepo$ with the async pipe, so a failed
  // lookup must end the stream rather than throw into the template.
  describe('with a git deployed project', () => {
    const project = {
      deploySource: { type: 'gitscm', scm: 'github', project: 'org/missing', branch: 'main', commit: 'abc', endpointGuid: '' },
    };

    beforeEach(async () => {
      await configure({ stratosProject: signal(project) });
      fixture = TestBed.createComponent(BuildTabComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    it('ends gitRepo$ without an error when the repository lookup fails', async () => {
      const events: string[] = [];
      component.gitRepo$.subscribe({
        next: () => events.push('next'),
        error: () => events.push('error'),
        complete: () => events.push('complete'),
      });
      await fixture.whenStable();
      TestBed.inject(HttpTestingController)
        .expectOne('https://api.github.com/repos/org/missing')
        .flush('nope', { status: 404, statusText: 'Not Found' });
      await fixture.whenStable();

      expect(events).not.toContain('error');
      expect(events).not.toContain('next');
    });
  });

  // App and env var refreshes hand the tab an equal deploy source again. The
  // git lookups depend only on that source, so a failed lookup is not
  // retried on every refresh.
  describe('when the app refreshes after a failed git lookup', () => {
    const source = { type: 'gitscm', scm: 'github', project: 'org/missing', branch: 'main', commit: 'abc', endpointGuid: '' };
    const repoUrl = 'https://api.github.com/repos/org/missing';
    const commitUrl = 'https://api.github.com/repos/org/missing/commits/abc';
    const notFound = { status: 404, statusText: 'Not Found' };
    let stratosProject: WritableSignal<unknown>;
    let app: WritableSignal<unknown>;

    beforeEach(async () => {
      stratosProject = signal({ deploySource: { ...source } });
      app = signal({ entity: { instances: 1 } });
      // The deploy source shows once the space allows env var reads.
      await configure({ stratosProject, app, space: signal({ guid: 'space-1' }) });
      vi.spyOn(TestBed.inject(CurrentUserPermissionsService), 'can').mockReturnValue(of(true));
      fixture = TestBed.createComponent(BuildTabComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    it('looks the repository and the commit up once while the source stays the same', async () => {
      const httpMock = TestBed.inject(HttpTestingController);
      const subs = [
        component.gitRepo$.subscribe({ error: () => undefined }),
        component.deploySource$.subscribe(),
      ];
      await fixture.whenStable();
      const repoRequests = httpMock.match(repoUrl);
      const commitRequests = httpMock.match(commitUrl);
      expect(repoRequests.length).toBe(1);
      expect(commitRequests.length).toBe(1);
      repoRequests.forEach(r => r.flush('nope', notFound));
      commitRequests.forEach(r => r.flush('nope', notFound));
      await fixture.whenStable();

      for (let i = 0; i < 3; i++) {
        stratosProject.set({ deploySource: { ...source } });
        app.set({ entity: { instances: 1 } });
        await fixture.whenStable();
      }

      expect(httpMock.match(repoUrl).length).toBe(0);
      expect(httpMock.match(commitUrl).length).toBe(0);
      subs.forEach(sub => sub.unsubscribe());
    });
  });
});
