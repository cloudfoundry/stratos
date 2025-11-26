import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestEntityCatalog } from '../entity-catalog/entity-catalog';
import { PaginationMonitorFactory } from './pagination-monitor.factory';
import type { Store } from '@ngrx/store';
import type { AppState } from '../app-state';

describe('PaginationMonitorFactoryService', () => {
  let service: PaginationMonitorFactory;
  let mockStore: Partial<Store<AppState>>;
  let mockEntityCatalog: TestEntityCatalog;

  beforeEach(() => {
    // Create mocks
    mockStore = {} as Store<AppState>;
    mockEntityCatalog = new TestEntityCatalog();

    // Create service directly with mocked dependencies
    service = new PaginationMonitorFactory(mockStore, mockEntityCatalog);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
