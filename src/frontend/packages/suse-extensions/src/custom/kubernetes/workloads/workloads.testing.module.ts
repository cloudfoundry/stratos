import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { CoreModule } from '@angular/flex-layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '../../../../../core/src/public-api';
import { AppTestModule } from '../../../../../core/test-framework/core-test.helper';
import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule } from '../../../../../store/src/entity-catalog.module';
import { entityCatalog, TestEntityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog';
import { generateStratosEntities } from '../../../../../store/src/stratos-entity-generator';
import { createBasicStoreModule } from '../../../../../store/testing/public-api';
import { generateHelmEntities } from '../../helm/helm-entity-generator';
import { HelmTestingModule } from '../../helm/helm-testing.module';
import { generateKubernetesEntities } from '../kubernetes-entity-generator';

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
            ...generateHelmEntities(),
          ];
        }
      }
    ]
  }]
})
export class WorkloadsTestingModule { }

export const WorkloadsBaseTestingModule = [
  AppTestModule,
  RouterTestingModule,
  CoreModule,
  createBasicStoreModule(),
  NoopAnimationsModule,
  HttpClientModule,
  SharedModule,
  HelmTestingModule,
  WorkloadsTestingModule
]
