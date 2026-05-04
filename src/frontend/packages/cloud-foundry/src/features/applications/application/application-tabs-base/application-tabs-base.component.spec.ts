import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';

import { ApplicationServiceMock, generateCfStoreModules, ApplicationStateService, ApplicationEnvVarsHelper, populateStoreWithTestEndpoint } from '@test-framework/cf';
import {ApplicationService, CFAppState} from '@stratosui/cloud-foundry';
import { EndpointModel, endpointEntitiesSelector, UserFavoriteManager } from '@stratosui/store';
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
  let store: Store<CFAppState>;
  let applicationServiceMock: ApplicationServiceMock;

  beforeEach(async () => {
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

    // The issue is that observableOf() completes immediately after emitting,
    // which causes withLatestFrom to miss values. We need observables that
    // emit but don't complete immediately.

    // Create mock endpoint data for store selector
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
        Fragment: '',
        RawFragment: ''
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
      logged_in_as_admin: false
    };

    const endpointsSubject = new BehaviorSubject<{ [guid: string]: EndpointModel }>({
      mockCfGuid: mockEndpoint
    });

    await TestBed.configureTestingModule({
      imports: [
        ApplicationTabsBaseComponent,
        ...generateCfStoreModules(),
        HttpClientTestingModule,
      ],
      providers: [
        { provide: ApplicationService, useValue: applicationServiceMock },
        { provide: EndpointsService, useValue: mockEndpointsService },
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
        { provide: AppDetailDataService, useValue: { refresh: () => Promise.resolve() } },
        provideRouter([]),
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    store = TestBed.inject(Store);
    populateStoreWithTestEndpoint();

    // Override store.select to return our mocked endpoints observable
    const originalSelect = store.select.bind(store);
    store.select = vi.fn().mockImplementation((selector: any) => {
      // Return mocked endpoints for the endpoint selector
      if (selector === endpointEntitiesSelector) {
        return endpointsSubject.asObservable();
      }
      // Fall back to original select for other selectors
      return originalSelect(selector);
    }) as any;

    fixture = TestBed.createComponent(ApplicationTabsBaseComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() as the component's constructor subscribes to observables
    // that may not have all the data they need in the test environment
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
