import { CloudFoundryEndpointService } from '../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { Store, StoreModule } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { EntityServiceFactory } from '../core/entity-service-factory.service';
import { CloudFoundryBaseComponent } from '../features/cloud-foundry/cloud-foundry-base/cloud-foundry-base.component';
import { CloudFoundryService } from '../features/cloud-foundry/services/cloud-foundry.service';
import { PaginationMonitor } from '../shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../shared/monitors/pagination-monitor.factory';
import { RouterTestingModule } from '@angular/router/testing';
import { CoreModule } from '../core/core.module';
import { createBasicStoreModule, testSCFGuid } from './store-test-helper';
import { SharedModule } from '../shared/shared.module';
import { CfOrgSpaceDataService } from '../shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../shared/data-services/cf-user.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';

const cfEndpointServiceProviderDeps = [
  EntityServiceFactory,
  CfOrgSpaceDataService,
  CfUserService,
  PaginationMonitorFactory,
  EntityMonitorFactory
];

export function generateTestCfEndpointServiceProvider(guid = testSCFGuid) {
  return {
    provide: CloudFoundryEndpointService,
    useFactory: (
      store: Store<AppState>,
      entityServiceFactory: EntityServiceFactory,
      cfOrgSpaceDataService: CfOrgSpaceDataService,
      cfUserService: CfUserService,
      paginationMonitorFactory: PaginationMonitorFactory
    ) => {
      const appService = new CloudFoundryEndpointService(
        {
          guid
        },
        store,
        entityServiceFactory,
        cfOrgSpaceDataService,
        cfUserService,
        paginationMonitorFactory
      );
      return appService;
    },
    deps: [Store, ...cfEndpointServiceProviderDeps]
  };
}

export function generateTestCfEndpointService() {
  return [
    ...cfEndpointServiceProviderDeps,
    generateTestCfEndpointServiceProvider()
  ];
}

export function generateTestCfUserServiceProvider(cfGuid = testSCFGuid) {
  return {
    provide: CfUserService,
    useFactory: (
      store: Store<AppState>,
      paginationMonitorFactory: PaginationMonitorFactory
    ) => {
      const cfUserService = new CfUserService(store, paginationMonitorFactory);
      return cfUserService;
    },
    deps: [Store, PaginationMonitorFactory]
  };
}

export function generateTestCfServiceProvider() {
  return {
    provide: CloudFoundryService,
    useFactory: (
      store: Store<AppState>,
      paginationMonitorFactory: PaginationMonitorFactory
    ) => {
      const appService = new CloudFoundryService(
        store,
        paginationMonitorFactory
      );
      return appService;
    },
    deps: [Store, PaginationMonitorFactory]
  };
}

export const getBaseTestModulesNoShared = [
  RouterTestingModule,
  CoreModule,
  createBasicStoreModule(),
  NoopAnimationsModule
];
export const getBaseTestModules = [...getBaseTestModulesNoShared, SharedModule];

export const getBaseProviders = [createBasicStoreModule()];
