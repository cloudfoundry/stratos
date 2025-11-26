import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestEntityCatalog } from './entity-catalog/entity-catalog';
import { EntityServiceFactory } from './entity-service-factory.service';
import type { EntityMonitorFactory } from './monitors/entity-monitor.factory.service';
import type { Store } from '@ngrx/store';
import type { GeneralEntityAppState } from './app-state';

describe('EntityServiceFactoryService', () => {
  let service: EntityServiceFactory;
  let mockStore: Partial<Store<GeneralEntityAppState>>;
  let mockEntityMonitorFactory: Partial<EntityMonitorFactory>;
  let mockEntityCatalog: TestEntityCatalog;

  beforeEach(() => {
    // Create mocks
    mockStore = {} as Store<GeneralEntityAppState>;
    mockEntityMonitorFactory = {
      create: vi.fn(),
    };
    mockEntityCatalog = new TestEntityCatalog();

    // Create service directly with mocked dependencies
    service = new EntityServiceFactory(
      mockStore,
      mockEntityMonitorFactory,
      mockEntityCatalog,
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
