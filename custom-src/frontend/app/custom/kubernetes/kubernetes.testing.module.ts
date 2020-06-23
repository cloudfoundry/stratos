import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule } from '../../../../store/src/entity-catalog.module';
import { entityCatalog, TestEntityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import { createBasicStoreModule } from '../../../../store/testing/public-api';
import { AppTestModule } from '../../../test-framework/core-test.helper';
import { generateStratosEntities } from '../../base-entity-types';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { HelmReleaseActivatedRouteMock, HelmReleaseGuidMock } from '../helm/helm-testing.module';
import { generateKubernetesEntities } from './kubernetes-entity-generator';
import { BaseKubeGuid } from './kubernetes-page.types';
import { HelmReleaseHelperService } from './workloads/release/tabs/helm-release-helper.service';

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
            ...generateKubernetesEntities(),
          ];
        }
      }
    ]
  }]
})
export class KubernetesTestingModule { }

export const KubernetesBaseTestModules = [
  AppTestModule,
  KubernetesTestingModule,
  RouterTestingModule,
  CoreModule,
  createBasicStoreModule(),
  NoopAnimationsModule,
  HttpClientModule,
  SharedModule,
];

export const HelmReleaseProviders = [
  HelmReleaseHelperService,
  HelmReleaseActivatedRouteMock,
  HelmReleaseGuidMock,
];

export const KubeBaseGuidMock = { provide: BaseKubeGuid, useValue: { guid: 'anything' } };
