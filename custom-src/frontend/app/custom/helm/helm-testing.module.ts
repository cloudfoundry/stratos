import { HttpClient, HttpHandler } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { generateStratosEntities } from '../../base-entity-types';
import { CoreModule } from '../../core/core.module';
import { CATALOGUE_ENTITIES, EntityCatalogueFeatureModule } from '../../core/entity-catalogue.module';
import { entityCatalogue, TestEntityCatalogue } from '../../core/entity-catalogue/entity-catalogue.service';
import { SharedModule } from '../../shared/shared.module';
import { generateHelmEntities } from './helm-entity-generator';
import { HelmReleaseHelperService } from './release/tabs/helm-release-helper.service';
import { HelmReleaseGuid } from './store/helm.types';

@NgModule({
  imports: [{
    ngModule: EntityCatalogueFeatureModule,
    providers: [
      {
        provide: CATALOGUE_ENTITIES, useFactory: () => {
          const testEntityCatalogue = entityCatalogue as TestEntityCatalogue;
          testEntityCatalogue.clear();
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

