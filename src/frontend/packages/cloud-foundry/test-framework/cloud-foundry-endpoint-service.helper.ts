import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Store, StoreModule } from '@ngrx/store';
import { testSCFEndpointGuid } from '@stratos/store/testing';

import { CoreModule } from '../../core/src/core/core.module';
import { SharedModule } from '../../core/src/shared/shared.module';
import { AppTestModule } from '../../core/test-framework/core-test.helper';
import { EntityServiceFactory } from '../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../store/src/monitors/pagination-monitor.factory';
import { appReducers } from '../../store/src/reducers.module';
import { CFAppState } from '../src/cf-app-state';
import { CloudFoundryTestingModule } from '../src/cloud-foundry-test.module';
import { ActiveRouteCfOrgSpace } from '../src/features/cloud-foundry/cf-page.types';
import { CloudFoundryEndpointService } from '../src/features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  UserInviteConfigureService,
  UserInviteService,
} from '../src/features/cloud-foundry/user-invites/user-invite.service';
import { CfOrgSpaceDataService } from '../src/shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../src/shared/data-services/cf-user.service';
import { CloudFoundryService } from '../src/shared/data-services/cloud-foundry.service';
import { createUserRoleInOrg } from '../src/store/types/user.types';
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
    CfUserServiceTestProvider,
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
    generateTestCfEndpointServiceProvider()
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
      store: Store<CFAppState>,
    ) => {
      const appService = new CloudFoundryService(store);
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
    manageUsersRoles: {
      users: [],
      cfGuid: '',
      newRoles: {
        name: '',
        orgGuid: '',
        spaces: {},
        permissions: createUserRoleInOrg(
          undefined,
          undefined,
          undefined,
          undefined
        )
      },
      changedRoles: []
    },
  };
}

export function generateCfStoreModules() {
  return [
    CloudFoundryTestingModule,
    StoreModule.forRoot(
      appReducers, { runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false } },
      // Do not include initial store here, it's properties will be ignored as they won't have corresponding reducers in appReducers
    ),
    AppTestModule
  ];
}

export function generateCfBaseTestModulesNoShared() {
  return [
    ...generateCfStoreModules(),
    RouterTestingModule,
    CoreModule,
    NoopAnimationsModule,
    HttpClientModule
  ];
}

export function generateCfBaseTestModules() {
  return [
    ...generateCfBaseTestModulesNoShared(),
    SharedModule,
  ];
}
