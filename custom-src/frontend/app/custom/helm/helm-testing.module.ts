import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule } from '../../../../store/src/entity-catalog.module';
import { entityCatalog, TestEntityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import { createBasicStoreModule } from '../../../../store/testing/public-api';
import { AppTestModule } from '../../../test-framework/core-test.helper';
import { generateStratosEntities } from '../../base-entity-types';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
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

