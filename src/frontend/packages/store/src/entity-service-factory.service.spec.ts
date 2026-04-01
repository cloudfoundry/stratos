import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Store } from '@ngrx/store';

import { TestEntityCatalog } from './entity-catalog/entity-catalog';
import { EntityServiceFactory } from './entity-service-factory.service';
import { EntityMonitorFactory } from './monitors/entity-monitor.factory.service';
import { ENTITY_CATALOG_TOKEN } from './tokens/store-injection.tokens';

describe('EntityServiceFactoryService', () => {
  let service: EntityServiceFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        EntityServiceFactory,
        { provide: Store, useValue: {} },
        { provide: EntityMonitorFactory, useValue: { create: vi.fn() } },
        { provide: ENTITY_CATALOG_TOKEN, useValue: new TestEntityCatalog() },
      ],
    });

    service = TestBed.inject(EntityServiceFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
