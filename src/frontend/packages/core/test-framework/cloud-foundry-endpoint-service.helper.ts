import { HttpClient, HttpHandler } from '@angular/common/http';
import { Http, HttpModule } from '@angular/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Store } from '@ngrx/store';

import { CoreModule } from '../src/core/core.module';
import { EntityServiceFactory } from '../src/core/entity-service-factory.service';
import {
  ApplicationStateIconComponent,
} from '../src/shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from '../src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import { CardStatusComponent } from '../src/shared/components/cards/card-status/card-status.component';
import { MetaCardComponent } from '../src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import {
  MetaCardItemComponent,
} from '../src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import {
  MetaCardKeyComponent,
} from '../src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import {
  MetaCardTitleComponent,
} from '../src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import {
  MetaCardValueComponent,
} from '../src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { MultilineTitleComponent } from '../src/shared/components/multiline-title/multiline-title.component';
import { EntityMonitorFactory } from '../src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../src/shared/monitors/pagination-monitor.factory';
import { SharedModule } from '../src/shared/shared.module';
import { createBasicStoreModule, testSCFGuid } from './store-test-helper';
import { CfUserServiceTestProvider } from './user-service-helper';
import { CFAppState } from '../../cloud-foundry/src/cf-app-state';
import { CfOrgSpaceDataService } from '../../cloud-foundry/src/shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../../cloud-foundry/src/shared/data-services/cf-user.service';
import { UserInviteService } from '../../cloud-foundry/src/features/cloud-foundry/user-invites/user-invite.service';
import { CloudFoundryEndpointService } from '../../cloud-foundry/src/features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { ActiveRouteCfOrgSpace } from '../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { CloudFoundryService } from '../../cloud-foundry/src/shared/data-services/cloud-foundry.service';

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
export function generateTestCfEndpointServiceProvider(guid = testSCFGuid) {
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

export function generateTestCfUserServiceProvider(guid = testSCFGuid) {
  return {
    provide: CfUserService,
    useFactory: (
      store: Store<CFAppState>,
      paginationMonitorFactory: PaginationMonitorFactory,
      entityServiceFactory: EntityServiceFactory,
      http: Http
    ) => {
      return new CfUserService(
        store,
        paginationMonitorFactory,
        { cfGuid: guid, orgGuid: guid, spaceGuid: guid },
        entityServiceFactory,
        http);
    },
    deps: [Store, PaginationMonitorFactory, EntityServiceFactory, Http]
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

export const BaseTestModulesNoShared = [
  RouterTestingModule,
  CoreModule,
  createBasicStoreModule(),
  NoopAnimationsModule,
  HttpModule
];
export const BaseTestModules = [...BaseTestModulesNoShared, SharedModule];

export const MetadataCardTestComponents = [MetaCardComponent, MetaCardItemComponent,
  MetaCardKeyComponent, ApplicationStateIconPipe, ApplicationStateIconComponent,
  MetaCardTitleComponent, CardStatusComponent, MetaCardValueComponent, MultilineTitleComponent];
