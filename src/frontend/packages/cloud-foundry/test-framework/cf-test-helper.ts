import { BaseTestModules } from '../../core/test-framework/core-test.helper';
import { generateStratosEntities } from '../../store/src/base-entity-types';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from '../../store/src/entity-catalog-test.module';
import { generateCFEntities } from '../src/cf-entity-generator';

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
