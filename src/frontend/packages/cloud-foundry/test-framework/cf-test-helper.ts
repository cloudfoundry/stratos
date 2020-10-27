import { BaseTestModules } from '../../core/test-framework/core-test.helper';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from '../../store/src/entity-catalog-test.module';
import { generateStratosEntities } from '../../store/src/stratos-entity-generator';
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
