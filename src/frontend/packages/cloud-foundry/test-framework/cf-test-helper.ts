import { BaseTestModules } from '../../core/test-framework/core-test.helper';
import { EntityCatalogueTestModule, TEST_CATALOGUE_ENTITIES } from '../../core/src/core/entity-catalogue-test.module';
import { generateCFEntities } from '../src/cf-entity-generator';
import { generateStratosEntities } from '../../core/src/base-entity-types';

export const CFBaseTestModules = [
  ...BaseTestModules,
  {
    ngModule: EntityCatalogueTestModule,
    providers: [
      {
        provide: TEST_CATALOGUE_ENTITIES, useValue: [
          ...generateStratosEntities(),
          ...generateCFEntities()
        ]
      }
    ]
  }
];
