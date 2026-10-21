import { NgModule } from '@angular/core';

import {
  CATALOGUE_ENTITIES,
  entityCatalog,
  EntityCatalogFeatureModule,
  TestEntityCatalog,
} from '../../../../store/src/public-api';
import { generateStratosEntities } from '../../../../store/src/stratos-entity-generator';
import { STORE_TEST_PROVIDERS } from '../../../../store/testing/public-api';
import { generateHelmEntities } from '../../helm/helm-entity-generator';
import { kubeEntityCatalog } from '../kubernetes-entity-generator';

@NgModule({
  imports: [
    EntityCatalogFeatureModule,
  ],
  providers: [
    ...STORE_TEST_PROVIDERS,
    {
      provide: CATALOGUE_ENTITIES,
      useFactory: () => {
        const testEntityCatalog = entityCatalog as TestEntityCatalog;
        testEntityCatalog.clear();
        return [
          ...generateStratosEntities(),
          ...kubeEntityCatalog.allKubeEntities(),
          ...generateHelmEntities(),
        ];
      },
      multi: true
    }
  ]
})
export class WorkloadsTestingModule { }
