import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';

import { ApplicationServiceMock, makeAppDetailDataServiceStub, generateCfStoreModules, ApplicationStateService, ApplicationEnvVarsHelper, populateStoreWithTestEndpoint } from '@test-framework/cf';
import {ApplicationService} from '@stratosui/cloud-foundry';
import { EndpointModel, EndpointsDataService, UserFavoriteManager } from '@stratosui/store';
import {
  EndpointsService,
  CurrentUserPermissionsService
} from '@stratosui/core';
import { GitSCMService } from '@stratosui/git';
import { ApplicationTabsBaseComponent } from './application-tabs-base.component';
import { AppLifecycleStateService } from '../../app-lifecycle-state.service';
import { AppDetailDataService } from '../../app-detail-data.service';
import { AppApplicationActionsService } from '../../../../shared/services/application-actions.service';
import { AppLifecycleProgressService } from '../../../../shared/components/app-lifecycle-progress/app-lifecycle-progress.service';

describe('ApplicationTabsBaseComponent', () => {
  let component: ApplicationTabsBaseComponent;
  let fixture: ComponentFixture<ApplicationTabsBaseComponent>;
  let applicationServiceMock: ApplicationServiceMock;
  // The detail signals the component derives from; each test writes them.
  const app = signal<any>(undefined);
  const org = signal<any>(undefined);
  const space = signal<any>(undefined);
  const loading = signal<any>({ app: false, envVars: false, stats: false });

  beforeEach(async () => {
    app.set(undefined); org.set(undefined); space.set(undefined);
    loading.set({ app: false, envVars: false, stats: false });
    // Create mock - we'll override specific observables to prevent immediate completion
    applicationServiceMock = new ApplicationServiceMock();

    // Create mock for EndpointsService.hasMetrics() that returns a BehaviorSubject
    // to prevent immediate completion which causes EmptyErrors
    const hasMetricsSubject = new BehaviorSubject<boolean>(false);
    const disablePersistenceFeaturesSubject = new BehaviorSubject<boolean>(false);
    const mockEndpointsService = {
      hasMetrics: vi.fn().mockReturnValue(hasMetricsSubject.asObservable()),
      disablePersistenceFeatures$: disablePersistenceFeaturesSubject.asObservable()
    };

    // Mock other required services
    const mockCurrentUserPermissionsService = {
      can: vi.fn().mockReturnValue(new BehaviorSubject<boolean>(true).asObservable())
    };

    const mockGitSCMService = {
      getSCM: vi.fn().mockReturnValue({
        getLabel: () => 'Git',
        getIcon: () => ({ fontName: 'stratos-icons', iconName: 'git' })
      })
    };

    const mockUserFavoriteManager = {
      getFavorite: vi.fn().mockReturnValue(null)
    };

    // Wave 2 (W36-B): mock `EndpointsDataService` instead of overriding
    // `store.select(endpointEntitiesSelector)`. Endpoint entity reads now
    // come from the data service's signal surface.
    const mockEndpoint: EndpointModel = {
      guid: 'mockCfGuid',
      name: 'Mock CF',
      cnsi_type: 'cf',
      api_endpoint: {
        Scheme: 'https',
        Opaque: '',
        User: null,
        Host: 'api.mock.cf',
        Path: '',
        RawPath: '',
        ForceQuery: false,
        RawQuery: '',
        Fragment: ''
      },
      authorization_endpoint: '',
      token_endpoint: '',
      doppler_logging_endpoint: '',
      skip_ssl_validation: false,
      user: {
        guid: 'user-guid',
        name: 'test-user',
        admin: false,
        scopes: []
      },
      system_shared_token: false,
      sso_allowed: false,
      sub_type: '',
      metadata: {},
      creator: { name: 'test-user', admin: false, system: false }
    };

    const endpointsMap: WritableSignal<Map<string, EndpointModel>> = signal(
      new Map([['mockCfGuid', mockEndpoint]])
    );
    const mockEndpointsDataService = {
      endpoints: endpointsMap,
      whenReady: () => Promise.resolve(),
      waitFor: (guid: string) => {
        const ep = endpointsMap().get(guid);
        return ep ? Promise.resolve(ep) : Promise.reject(new Error(`Endpoint ${guid} not found`));
      },
    };

    await TestBed.configureTestingModule({
      imports: [
        ApplicationTabsBaseComponent,
        ...generateCfStoreModules(),
        HttpClientTestingModule,
      ],
      providers: [
        { provide: ApplicationService, useValue: applicationServiceMock },
        { provide: EndpointsService, useValue: mockEndpointsService },
        { provide: EndpointsDataService, useValue: mockEndpointsDataService },
        { provide: CurrentUserPermissionsService, useValue: mockCurrentUserPermissionsService },
        { provide: GitSCMService, useValue: mockGitSCMService },
        { provide: UserFavoriteManager, useValue: mockUserFavoriteManager },
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        // Slice 1 fallback providers — these used to be supplied at the
        // tabs-base level itself; they now live on ApplicationBaseComponent
        // (the parent), so the bare component test must wire them up.
        AppLifecycleStateService,
        AppApplicationActionsService,
        AppLifecycleProgressService,
        // AppApplicationActionsService injects AppDetailDataService for
        // the post-op refresh fan-out. Provide a no-op stub so the test
        // doesn't need to thread the full HTTP-backed service.
        { provide: AppDetailDataService, useValue: {
          ...makeAppDetailDataServiceStub(), refresh: () => Promise.resolve(), updating: signal(false),
          app, org, space, loading,
        } },
        provideRouter([]),
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    populateStoreWithTestEndpoint();

    fixture = TestBed.createComponent(ApplicationTabsBaseComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() as the component's constructor subscribes to observables
    // that may not have all the data they need in the test environment
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('shows the loading overlay only until the app arrives', () => {
    loading.set({ app: true, envVars: false, stats: false });
    expect(component.isFetching()).toBe(true);
    app.set({ entity: { cfGuid: 'mockCfGuid', name: 'my-app' } });
    expect(component.isFetching()).toBe(false);
  });

  it('builds the breadcrumbs once the app, endpoint, org and space are known', () => {
    expect(component.breadcrumbs()).toBeNull();
    app.set({ entity: { cfGuid: 'mockCfGuid', name: 'my-app' } });
    org.set({ guid: 'org-1', name: 'my-org' });
    expect(component.breadcrumbs()).toBeNull();
    space.set({ guid: 'space-1', name: 'my-space' });
    const crumbs = component.breadcrumbs()!;
    const spaceCrumbs = crumbs.find(c => c.key === 'space')!.breadcrumbs;
    expect(spaceCrumbs.map(c => c.value)).toEqual(['Mock CF', 'my-org', 'my-space']);
    expect(spaceCrumbs[2].routerLink).toBe('/cloud-foundry/mockCfGuid/organizations/org-1/spaces/space-1/apps');
  });

  // GUARD: an app-detail error bounce must stay CF-scoped when the app was
  // opened from the per-CF applications tab (?breadcrumbs=cf), not dump the
  // user on the global cross-CF wall. Mirrors the delete flow's scoping.
  describe('appErrorRedirect', () => {
    it('returns the CF-scoped apps tab when opened from it (breadcrumbs=cf)', () => {
      expect(ApplicationTabsBaseComponent.appErrorRedirect('cf', 'cf-1'))
        .toEqual(['/cloud-foundry', 'cf-1', 'applications']);
    });

    it('returns the global wall for any other source', () => {
      expect(ApplicationTabsBaseComponent.appErrorRedirect(undefined, 'cf-1')).toEqual(['applications']);
      expect(ApplicationTabsBaseComponent.appErrorRedirect('org', 'cf-1')).toEqual(['applications']);
      expect(ApplicationTabsBaseComponent.appErrorRedirect(null, 'cf-1')).toEqual(['applications']);
    });
  });
});
