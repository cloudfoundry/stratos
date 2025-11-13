/**
 * Test Helper Re-export (Src Root Level)
 *
 * This file re-exports all test helpers from the root test-framework directory
 * to make them available to spec files in the src/ directory tree.
 *
 * All exports are delegated to the main test helper file:
 * @see ../test-framework/core-test.helper.ts (at the package root)
 */

// Import all exports from the main test helper file (at package root)
export {
  AppTestModule,
  generateBaseTestStoreModules,
  BaseTestModulesNoShared,
  BaseTestModules,
  MetadataCardTestComponents,
} from '../../test-framework/core-test.helper';

// Re-export store testing utilities using relative paths (aliases don't resolve well from this location)
export { createBasicStoreModule, createEmptyStoreModule, createEntityStore, createEntityStoreState, populateStoreWithTestEndpoint } from '../../../store/testing/index';
export { StoreTestingModule } from '../../../store/testing/index';
export { STORE_TEST_PROVIDERS } from '../../../store/testing/index';

// Re-export core test module (from package root test-framework directory)
export { CoreTestingModule } from '../../test-framework/core-test.modules';

// For backward compatibility, also export commonly used types
export type { EntityCatalogHelper } from '@stratosui/store';
