import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TestEntityCatalog } from '../entity-catalog/entity-catalog';
import { PaginationMonitorFactory } from './pagination-monitor.factory';
import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { ENTITY_CATALOG_TOKEN } from '../tokens/store-injection.tokens';

describe('PaginationMonitorFactoryService', () => {
  let service: PaginationMonitorFactory;
  let mockStore: any;
  let mockEntityCatalog: TestEntityCatalog;

  beforeEach(() => {
    mockStore = {} as Store<AppState>;
    mockEntityCatalog = new TestEntityCatalog();

    TestBed.configureTestingModule({
      providers: [
        PaginationMonitorFactory,
        { provide: Store, useValue: mockStore },
        { provide: ENTITY_CATALOG_TOKEN, useValue: mockEntityCatalog },
      ],
    });

    service = TestBed.inject(PaginationMonitorFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
