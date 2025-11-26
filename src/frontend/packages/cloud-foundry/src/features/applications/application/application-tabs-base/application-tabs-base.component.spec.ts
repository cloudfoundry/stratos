import { HttpClientTestingModule } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';

import { ApplicationServiceMock, generateCfStoreModules, ApplicationStateService, ApplicationEnvVarsHelper, populateStoreWithTestEndpoint } from '@test-framework/cf';
import {ApplicationService, type CFAppState, IApp, IOrganization, ISpace, CfCurrentUserPermissions} from '@stratosui/cloud-foundry';
import { APIResource, EntityInfo, RequestInfoState, type EndpointModel, endpointEntitiesSelector, UserFavoriteManager } from '@stratosui/store';
import {
  EndpointsService,
  CurrentUserPermissionsService
} from '@stratosui/core';
import { GitSCMService } from '@stratosui/git';
import { ApplicationTabsBaseComponent } from './application-tabs-base.component';

describe('ApplicationTabsBaseComponent', () => {
  let component: ApplicationTabsBaseComponent;
  let fixture: ComponentFixture<ApplicationTabsBaseComponent>;
  let store: Store;
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
        User: {},
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
      metricsAvailable: false,
      creator: {
        name: 'test-creator',
        admin: false,
        system: false
      }
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
        provideRouter([]),
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    store = TestBed.inject(Store);
    populateStoreWithTestEndpoint();

    // Override store.select to return our mocked endpoints observable
    const originalSelect = store.select.bind(store);
    vi.spyOn(store, 'select').mockImplementation((selector: any) => {
      // Return mocked endpoints for the endpoint selector
      if (selector === endpointEntitiesSelector) {
        return endpointsSubject.asObservable();
      }
      // Fall back to original select for other selectors
      return originalSelect(selector);
    });

    fixture = TestBed.createComponent(ApplicationTabsBaseComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() as the component's constructor subscribes to observables
    // that may not have all the data they need in the test environment
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
