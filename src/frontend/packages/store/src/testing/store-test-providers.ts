import { Provider } from '@angular/core';
import { EntityCatalog } from '../entity-catalog/entity-catalog';
import { EntityServiceFactory } from '../entity-service-factory.service';
import { EntityMonitorFactory } from '../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';
import {
  ENTITY_CATALOG_TOKEN,
  ENTITY_SERVICE_FACTORY_TOKEN,
  PAGINATION_MONITOR_FACTORY_TOKEN
} from '../tokens/store-injection.tokens';

/**
 * Test providers for store services with injection tokens.
 * Use this in TestBed.configureTestingModule() to provide all store services.
 */
export const STORE_TEST_PROVIDERS: Provider[] = [
  // Concrete services
  EntityCatalog,
  EntityServiceFactory,
  EntityMonitorFactory,
  PaginationMonitorFactory,

  // Injection tokens pointing to concrete services
  { provide: ENTITY_CATALOG_TOKEN, useExisting: EntityCatalog },
  { provide: ENTITY_SERVICE_FACTORY_TOKEN, useExisting: EntityServiceFactory },
  { provide: PAGINATION_MONITOR_FACTORY_TOKEN, useExisting: PaginationMonitorFactory },
];

/**
 * Convenience function to get store providers.
 * Can be extended with additional providers as needed.
 */
export function getStoreTestProviders(...additionalProviders: Provider[]): Provider[] {
  return [...STORE_TEST_PROVIDERS, ...additionalProviders];
}

/**
 * Mock factory creators for tests that need spy objects
 */
export function createMockEntityServiceFactory(): jasmine.SpyObj<EntityServiceFactory> {
  return { create: vi.fn() };
}

export function createMockEntityMonitorFactory(): jasmine.SpyObj<EntityMonitorFactory> {
  return { create: vi.fn(), getMonitor: vi.fn() };
}

export function createMockPaginationMonitorFactory(): jasmine.SpyObj<PaginationMonitorFactory> {
  return { create: vi.fn(), getMonitor: vi.fn() };
}

/**
 * Get providers with mock factories for isolated unit tests
 */
export function getMockStoreProviders(): Provider[] {
  const mockEntityServiceFactory = createMockEntityServiceFactory();
  const mockEntityMonitorFactory = createMockEntityMonitorFactory();
  const mockPaginationMonitorFactory = createMockPaginationMonitorFactory();

  return [
    { provide: EntityServiceFactory, useValue: mockEntityServiceFactory },
    { provide: ENTITY_SERVICE_FACTORY_TOKEN, useValue: mockEntityServiceFactory },
    { provide: EntityMonitorFactory, useValue: mockEntityMonitorFactory },
    { provide: PaginationMonitorFactory, useValue: mockPaginationMonitorFactory },
    { provide: PAGINATION_MONITOR_FACTORY_TOKEN, useValue: mockPaginationMonitorFactory },
    EntityCatalog,
    { provide: ENTITY_CATALOG_TOKEN, useExisting: EntityCatalog },
  ];
}