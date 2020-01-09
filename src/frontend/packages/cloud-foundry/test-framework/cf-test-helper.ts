import { BaseTestModules } from '../../core/test-framework/core-test.helper';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from '../../store/src/entity-catalog-test.module';
import { generateCFEntities } from '../src/cf-entity-generator';
import { generateStratosEntities } from '../../core/src/base-entity-types';

export const CFBaseTestModules = [
  ...BaseTestModules,
  {
    ngModule: EntityCatalogTestModule,
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
