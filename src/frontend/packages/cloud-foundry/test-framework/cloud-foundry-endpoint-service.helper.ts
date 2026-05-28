import { provideHttpClient, HttpClient, HttpHandler } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Store, StoreModule } from '@ngrx/store';

import { CoreModule, SharedModule } from '@stratosui/core';
import { EntityServiceFactory, EntityMonitorFactory, PaginationMonitorFactory, appReducers } from '@stratosui/store';
import { testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { AppTestModule, generateBaseTestStoreModules } from '@test-framework';

// Re-export test endpoint utilities for convenience
export { testSCFEndpointGuid, populateStoreWithTestEndpoint };

import { CFAppState } from '../src/cf-app-state';
import { CloudFoundryTestingModule } from '../src/cloud-foundry-test.module';
import { ActiveRouteCfOrgSpace } from '../src/features/cf/cf-page.types';
import { CloudFoundryEndpointService } from '../src/features/cf/services/cloud-foundry-endpoint.service';
import { UserInviteConfigureService, UserInviteService } from '../src/features/cf/user-invites/user-invite.service';
import { CfOrgSpaceDataService } from '../src/shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../src/shared/data-services/cf-user.service';
import { CloudFoundryService } from '../src/shared/data-services/cloud-foundry.service';
import { CfUserServiceTestProvider } from './user-service-helper';

export const cfEndpointServiceProviderDeps = [
  EntityServiceFactory,
  CfOrgSpaceDataService,
  CfUserService,
  PaginationMonitorFactory,
  EntityMonitorFactory,
  UserInviteService,
  HttpClient,
  HttpHandler,
  CloudFoundryEndpointService
];
export class BaseCfOrgSpaceRouteMock {
  orgGuid: string;
  spaceGuid: string;
  cfGuid: string;
  constructor(public guid = '1234') {
    this.cfGuid = guid;
    this.spaceGuid = guid;
    this.orgGuid = guid;
  }
}

export function generateCfActiveRouteMock(guid = testSCFEndpointGuid) {
  return {
    provide: ActivatedRoute,
    useValue: {
      snapshot: {
        params: {
          endpointId: guid,
          orgId: guid,
          spaceId: guid,
        },
        queryParams: {}
      }
    }
  };
}

export function generateActiveRouteCfOrgSpaceMock(guid = testSCFEndpointGuid) {
  return {
    provide: ActiveRouteCfOrgSpace,
    useFactory: () => new BaseCfOrgSpaceRouteMock(guid)
  };
}

export function generateTestCfEndpointServiceProvider(guid = testSCFEndpointGuid) {
  return [
    generateActiveRouteCfOrgSpaceMock(guid),
    generateCfActiveRouteMock(guid),
    ...CfUserServiceTestProvider,
    CloudFoundryEndpointService,
    UserInviteService,
    UserInviteConfigureService,
    HttpClient,
    HttpHandler
  ];
}

export function generateTestCfEndpointService() {
  return [
    ...cfEndpointServiceProviderDeps,
    ...generateTestCfEndpointServiceProvider()
  ];
}

export function generateTestCfUserServiceProvider(guid = testSCFEndpointGuid) {
  return {
    provide: CfUserService,
    useFactory: (
      store: Store<CFAppState>,
      paginationMonitorFactory: PaginationMonitorFactory,
    ) => {
      return new CfUserService(
        store,
        paginationMonitorFactory,
        { cfGuid: guid, orgGuid: guid, spaceGuid: guid },
      );
    },
    deps: [Store, PaginationMonitorFactory, HttpClient]
  };
}

export function generateTestCfServiceProvider() {
  return {
    provide: CloudFoundryService,
    useFactory: (
      _store: Store<CFAppState>,
    ) => {
      const appService = new CloudFoundryService();
      return appService;
    },
    deps: [Store]
  };
}

export function generateCfTopLevelStoreEntities() {
  return {
    createApplication: {
      cloudFoundryDetails: null,
      name: '',
      nameCheck: {
        checking: false,
        available: true,
        name: ''
      }
    },
    createServiceInstance: {
      name: '',
      servicePlanGuid: '',
      spaceGuid: '',
      orgGuid: '',
      spaceScoped: false
    },
    deployApplication: {
      cloudFoundryDetails: null,
      applicationSource: {
        type: {
          id: '',
          name: ''
        }
      },
      projectExists: {
        checking: false,
        exists: false,
        name: '',
        error: false
      }
    },
  };
}

export function generateCfStoreModules() {
  return [
    // AppTestModule is imported from core test framework which includes the basic store setup
    // This must come BEFORE CloudFoundryTestingModule because CloudFoundryTestingModule needs Store
    ...generateBaseTestStoreModules(),
    CloudFoundryTestingModule,
  ].filter(m => m !== undefined && m !== null);
}

/**
 * Generate CF store providers for standalone component testing
 * Use this instead of generateCfStoreModules() when using importProvidersFrom()
 */
export function generateCfStoreProviders() {
  return [
    CloudFoundryTestingModule,
    StoreModule.forRoot(
      appReducers, { runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false } }
    ),
    AppTestModule
  ];
}

export function generateCfBaseTestModulesNoShared() {
  return [
    ...generateCfStoreModules(),
    CoreModule,
    NoopAnimationsModule,
  ].filter(m => m !== undefined && m !== null);
}

export const CF_BASE_TEST_PROVIDERS = [
  provideRouter([]),
  provideHttpClient(),
];

export function generateCfBaseTestModules() {
  return [
    ...generateCfBaseTestModulesNoShared(),
    SharedModule,
  ];
}

// Re-export CloudFoundryTestingModule for convenience
export { CloudFoundryTestingModule };
