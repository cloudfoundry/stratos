import { CloudFoundryEndpointService } from '../features/cloud-foundry/cloud-foundry-base/cloud-foundry-endpoint.service';
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

export function generateTestCfEndpointServiceProvider(cfGuid = testSCFGuid) {
  return {
    provide: CloudFoundryEndpointService,
    useFactory: (
      store: Store<AppState>,
      entityServiceFactory: EntityServiceFactory,
      cfOrgSpaceDataService: CfOrgSpaceDataService,
      cfUserService: CfUserService
    ) => {
      const appService = new CloudFoundryEndpointService(
        cfGuid,
        store,
        entityServiceFactory,
        cfOrgSpaceDataService,
        cfUserService
      );
      return appService;
    },
    deps: [Store, EntityServiceFactory, CfOrgSpaceDataService, CfUserService]
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
  createBasicStoreModule()
];
export const getBaseTestModules = [...getBaseTestModulesNoShared, SharedModule];

export const getBaseProviders = [createBasicStoreModule()];
