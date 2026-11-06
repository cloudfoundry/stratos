import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CoreModule, SharedModule } from '@stratosui/core';
import { CoreTestingModule } from '../../../core/test-framework/core-test.modules';

import {
  CATALOGUE_ENTITIES,
  entityCatalog,
  EntityCatalogFeatureModule,
  TestEntityCatalog,
} from '../../../store/src/public-api';
import { generateStratosEntities } from '../../../store/src/stratos-entity-generator';
import { createBasicStoreModule } from '../../../store/testing/public-api';
import { HelmReleaseGuid } from '../kubernetes/workloads/workload.types';
import { generateHelmEntities } from './helm-entity-generator';


@NgModule({
  imports: [
    EntityCatalogFeatureModule,
  ],
  providers: [
    {
      provide: CATALOGUE_ENTITIES,
      useFactory: () => {
        const testEntityCatalog = entityCatalog as TestEntityCatalog;
        testEntityCatalog.clear();
        return [
          ...generateStratosEntities(),
          ...generateHelmEntities(),
        ];
      },
      multi: true
    }
  ]
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
  CoreTestingModule,
  createBasicStoreModule(),
  HelmTestingModule,
  RouterTestingModule,
  CoreModule,
  NoopAnimationsModule,
  HttpClientModule,
  SharedModule
].filter(Boolean);

export const HelmBaseTestProviders = [
  HttpClient,
  HttpHandler
];

