import { Provider } from '@angular/core';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { ENTITY_CATALOG_TOKEN } from '../tokens/store-injection.tokens';

/**
 * Test providers for store services with injection tokens.
 * Use this in TestBed.configureTestingModule() to provide all store services.
 *
 * The former ngrx `EntityServiceFactory` / `EntityMonitorFactory` /
 * `PaginationMonitorFactory` providers were removed with the request/pagination
 * store engine; only the entityCatalog token remains.
 */
export const STORE_TEST_PROVIDERS: Provider[] = [
  // Note: entityCatalog is a singleton instance, not an @Injectable class
  { provide: ENTITY_CATALOG_TOKEN, useValue: entityCatalog },
];

/**
 * Convenience function to get store providers.
 * Can be extended with additional providers as needed.
 */
export function getStoreTestProviders(...additionalProviders: Provider[]): Provider[] {
  return [...STORE_TEST_PROVIDERS, ...additionalProviders];
}
