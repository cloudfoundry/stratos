import { HttpClient, HttpHandler } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { createBasicStoreModule, registerEntitiesForTesting } from '../../../test-framework/store-test-helper';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { HelmStoreModule } from './helm.store.module';
import { HelmReleaseHelperService } from './release/tabs/helm-release-helper.service';
import { monocularEntities } from './store/helm.entities';
import { HelmReleaseGuid } from './store/helm.types';

@NgModule({
  imports: [
    HelmStoreModule
  ]
})
export class HelmTestingModule {

  constructor() {
    registerEntitiesForTesting(monocularEntities);
  }
}

export const HelmReleaseActivatedRouteMock = {
  provide: ActivatedRoute,
  useValue: {
    snapshot: {
      queryParams: {},
      params: {
        guid: '123:4'
      }
    }
  }
};

export const HelmReleaseGuidMock = {
  provide: HelmReleaseGuid,
  useValue: {
    guid: '123:4'
  }
};

export const HelmBaseTestModules = [
  HelmTestingModule,
  RouterTestingModule,
  CoreModule,
  createBasicStoreModule(),
  NoopAnimationsModule,
  HttpModule,
  SharedModule
];

export const HelmBaseTestProviders = [
  HelmReleaseHelperService,
  HelmReleaseActivatedRouteMock,
  HelmReleaseGuidMock,
  HttpClient,
  HttpHandler
];

