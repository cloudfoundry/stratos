import { HttpClient, HttpHandler } from '@angular/common/http';
import { Http, HttpModule } from '@angular/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Store, StoreModule } from '@ngrx/store';

import { CoreModule } from '../../core/src/core/core.module';
import { EntityServiceFactory } from '../../core/src/core/entity-service-factory.service';
import { EntityMonitorFactory } from '../../core/src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../core/src/shared/monitors/pagination-monitor.factory';
import { SharedModule } from '../../core/src/shared/shared.module';
import { CfUserServiceTestProvider } from '../../core/test-framework/user-service-helper';
import { appReducers } from '../../store/src/reducers.module';
import { AppStoreExtensionsModule } from '../../store/src/store.extensions.module';
import { CFAppState } from '../src/cf-app-state';
import { CloudFoundryTestingModule } from '../src/cloud-foundry-test.module';
import { ActiveRouteCfOrgSpace } from '../src/features/cloud-foundry/cf-page.types';
import { CloudFoundryEndpointService } from '../src/features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { UserInviteService } from '../src/features/cloud-foundry/user-invites/user-invite.service';
import { CfOrgSpaceDataService } from '../src/shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../src/shared/data-services/cf-user.service';
import { CloudFoundryService } from '../src/shared/data-services/cloud-foundry.service';
import { createUserRoleInOrg } from '../src/store/types/user.types';
import { CFEntityServiceFactory } from '../src/cf-entity-service-factory.service';
import { testSCFEndpointGuid } from '../../core/test-framework/store-test-helper';


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
export function generateTestCfEndpointServiceProvider(guid = testSCFEndpointGuid) {
  return [
    {
      provide: ActiveRouteCfOrgSpace,
      useFactory: () => new BaseCfOrgSpaceRouteMock(guid)
    },
    CfUserServiceTestProvider,
    CloudFoundryEndpointService,
    UserInviteService,
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
      entityServiceFactory: CFEntityServiceFactory
    ) => {
      return new CfUserService(
        store,
        paginationMonitorFactory,
        { cfGuid: guid, orgGuid: guid, spaceGuid: guid },
        entityServiceFactory,
      );
    },
    deps: [Store, PaginationMonitorFactory, CFEntityServiceFactory, Http]
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
    AppStoreExtensionsModule,
    StoreModule.forRoot(
      appReducers,
      // Do not include initial store here, it's properties will be ignored as they won't have corresponding reducers in appReducers
    )
  ];
}

export function generateCfBaseTestModulesNoShared() {
  return [
    ...generateCfStoreModules(),
    RouterTestingModule,
    CoreModule,
    NoopAnimationsModule,
    HttpModule
  ];
}

export function generateCfBaseTestModules() {
  return [
    ...generateCfBaseTestModulesNoShared(),
    SharedModule
  ];
}
