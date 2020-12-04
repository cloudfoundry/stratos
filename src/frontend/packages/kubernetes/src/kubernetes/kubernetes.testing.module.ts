import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule, SharedModule } from '../../../core/src/public-api';
import { TabNavService } from '../../../core/src/tab-nav.service';
import { AppTestModule } from '../../../core/test-framework/core-test.helper';
import {
  CATALOGUE_ENTITIES,
  entityCatalog,
  EntityCatalogFeatureModule,
  TestEntityCatalog,
} from '../../../store/src/public-api';
import { generateStratosEntities } from '../../../store/src/stratos-entity-generator';
import { createBasicStoreModule } from '../../../store/testing/public-api';
import { HelmReleaseActivatedRouteMock, HelmReleaseGuidMock } from '../helm/helm-testing.module';
import { kubeEntityCatalog } from './kubernetes-entity-generator';
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
            ...kubeEntityCatalog.allKubeEntities(),
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
  TabNavService
];

export const KubeBaseGuidMock = { provide: BaseKubeGuid, useValue: { guid: 'anything' } };
