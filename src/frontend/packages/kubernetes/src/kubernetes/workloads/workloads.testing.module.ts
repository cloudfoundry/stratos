import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule, SharedModule } from '../../../../core/src/public-api';
import { AppTestModule } from '../../../../core/test-framework/core-test.helper';
import {
  CATALOGUE_ENTITIES,
  entityCatalog,
  EntityCatalogFeatureModule,
  TestEntityCatalog,
} from '../../../../store/src/public-api';
import { generateStratosEntities } from '../../../../store/src/stratos-entity-generator';
import { createBasicStoreModule } from '../../../../store/testing/public-api';
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
];
