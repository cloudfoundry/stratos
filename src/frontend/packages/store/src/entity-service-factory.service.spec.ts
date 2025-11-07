import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestEntityCatalog } from './entity-catalog/entity-catalog';
import { EntityServiceFactory } from './entity-service-factory.service';
import { EntityMonitorFactory } from './monitors/entity-monitor.factory.service';
import { Store } from '@ngrx/store';
import { GeneralEntityAppState } from './app-state';

describe('EntityServiceFactoryService', () => {
  let service: EntityServiceFactory;
  let mockStore: any;
  let mockEntityMonitorFactory: any;
  let mockEntityCatalog: TestEntityCatalog;

  beforeEach(() => {
    // Create mocks
    mockStore = {} as Store<GeneralEntityAppState>;
    mockEntityMonitorFactory = {
      create: vi.fn(),
    } as any;
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
