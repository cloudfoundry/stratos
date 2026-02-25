// Test helper for cf-autoscaler package
// Re-export store testing utilities to resolve @stratosui/store/testing imports

// Import the store-test-helper directly
export { createBasicStoreModule, createEmptyStoreModule, createEntityStore, createEntityStoreState, populateStoreWithTestEndpoint } from '../../../store/testing/src/store-test-helper';
export { StoreTestingModule } from '../../../store/testing/src/store-test.module';
export { STORE_TEST_PROVIDERS } from '../../../store/src/testing/store-test-providers';
