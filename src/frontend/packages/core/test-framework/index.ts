/*
 * Public API Surface of @test-framework
 */

// Re-export everything from core-test.helper (which includes store testing utils)
export * from './core-test.helper';
export * from './core-test.modules';
export * from './entity-catalog-test-helpers';
export * from './entity-relations-spec-helper';
export * from './zoneless-testbed.helper';
export * from './standalone-test-utils';
export * from './mock-catalog-entities';

// Explicitly re-export test utilities to ensure they're available
export {
  createBasicStoreModule,
  createEmptyStoreModule,
  createEntityStore,
  createEntityStoreState,
  populateStoreWithTestEndpoint,
  StoreTestingModule,
  STORE_TEST_PROVIDERS,
  BASE_TEST_PROVIDERS,
  MetadataCardTestComponents,
  BaseTestModulesNoShared,
  BaseTestModules,
  AppTestModule
} from './core-test.helper';

// Explicitly re-export zoneless test utilities
export { configureZonelessTestBed } from './zoneless-testbed.helper';
