/*
 * Public API Surface of kubernetes test-framework
 */

// Re-export core test framework utilities - these come from @stratosui/core/test-framework
// But since we're in the kubernetes package, we need to import from the relative path
export {
  configureZonelessTestBed,
  BaseTestModules,
  BaseTestModulesNoShared,
  AppTestModule,
  generateBaseTestStoreModules,
  createBasicStoreModule,
  createEmptyStoreModule,
  createEntityStore,
  createEntityStoreState,
  populateStoreWithTestEndpoint,
  testSCFEndpointGuid,
  testSCFEndpoint,
  testSessionData,
  BASE_TEST_PROVIDERS,
  STORE_TEST_PROVIDERS,
  MetadataCardTestComponents,
  type TestStoreEntity
} from '../../core/test-framework';

// Re-export CoreTestingModule
export { CoreTestingModule } from '../../core/test-framework/core-test.modules';

// Re-export everything from kubernetes-test.helper
export * from './kubernetes-test.helper';

// Kubernetes Testing Modules
export {
  KubernetesTestingModule,
  generateKubeStoreModules,
  KubernetesBaseTestModules,
  HelmReleaseProviders,
  KubeBaseGuidMock
} from '../src/kubernetes/kubernetes.testing.module';

export {
  WorkloadsTestingModule,
  WorkloadsBaseTestingModule
} from '../src/kubernetes/workloads/workloads.testing.module';

export {
  HelmTestingModule,
  HelmReleaseActivatedRouteMock,
  HelmReleaseGuidMock,
  HelmBaseTestModules,
  HelmBaseTestProviders
} from '../src/helm/helm-testing.module';

// Explicitly export type for test metadata
export type { TestModuleMetadata } from '@angular/core/testing';
