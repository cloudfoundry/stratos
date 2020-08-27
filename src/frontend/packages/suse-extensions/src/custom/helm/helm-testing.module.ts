import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { CoreModule } from '@angular/flex-layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '@stratosui/core';

import { AppTestModule } from '../../../../core/test-framework/core-test.helper';
import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule } from '../../../../store/src/entity-catalog.module';
import { entityCatalog, TestEntityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import { generateStratosEntities } from '../../../../store/src/stratos-entity-generator';
import { createBasicStoreModule } from '../../../../store/testing/public-api';
import { HelmReleaseGuid } from '../kubernetes/workloads/workload.types';
import { generateHelmEntities } from './helm-entity-generator';


@NgModule({
  imports: [{
    ngModule: EntityCatalogFeatureModule,
    providers: [
      {
        provide: CATALOGUE_ENTITIES, useFactory: () => {
          const testEntityCatalog = entityCatalog as TestEntityCatalog;
          testEntityCatalog.clear();
          return [
            ...generateStratosEntities(),
            ...generateHelmEntities(),
          ];
        }
      }
    ]
  }]
})
export class HelmTestingModule { }


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
  AppTestModule,
  HelmTestingModule,
  RouterTestingModule,
  CoreModule,
  createBasicStoreModule(),
  NoopAnimationsModule,
  HttpClientModule,
  SharedModule
];

export const HelmBaseTestProviders = [
  HttpClient,
  HttpHandler
];

