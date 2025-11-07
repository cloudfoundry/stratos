import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { entityCatalog } from '../entity-catalog/entity-catalog';
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
  EntityServiceFactory,
  EntityMonitorFactory,
  PaginationMonitorFactory,

  // Injection tokens pointing to services
  // Note: entityCatalog is a singleton instance, not an @Injectable class
  { provide: ENTITY_CATALOG_TOKEN, useValue: entityCatalog },
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
export function createMockEntityServiceFactory(): any {
  return { create: vi.fn() };
}

export function createMockEntityMonitorFactory(): any {
  return { create: vi.fn(), getMonitor: vi.fn() };
}

export function createMockPaginationMonitorFactory(): any {
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
    { provide: ENTITY_CATALOG_TOKEN, useValue: entityCatalog },
  ];
}