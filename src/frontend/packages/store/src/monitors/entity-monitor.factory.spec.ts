import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestEntityCatalog } from '../entity-catalog/entity-catalog';
import { EntityMonitorFactory } from './entity-monitor.factory.service';
import type { Store } from '@ngrx/store';
import type { AppState } from '../app-state';

describe('EntityMonitor', () => {
  let service: EntityMonitorFactory;
  let mockStore: Partial<Store<AppState>>;
  let mockEntityCatalog: TestEntityCatalog;

  beforeEach(() => {
    // Create mocks
    mockStore = {} as Store<AppState>;
    mockEntityCatalog = new TestEntityCatalog();

    // Create service directly with mocked dependencies
    service = new EntityMonitorFactory(mockStore, mockEntityCatalog);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
