import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { BaseTestModules, BASE_TEST_PROVIDERS } from '@test-framework';
import { generateCFEntities } from '../src/cf-entity-generator';

// Re-export CF entity generator for test files
export { generateCFEntities };

// Modules for imports array
export const CFBaseTestModules = [
  ...BaseTestModules,
  EntityCatalogTestModule
];

// Providers for providers array
export const CFBaseTestProviders = [
  ...BASE_TEST_PROVIDERS,
  {
    provide: TEST_CATALOGUE_ENTITIES,
    useFactory: () => [
      ...generateStratosEntities(),
      ...generateCFEntities()
    ]
  }
];
