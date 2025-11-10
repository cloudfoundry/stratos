import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  generateTestCfEndpointServiceProvider,
} from '@test-framework/cloud-foundry-endpoint-service.helper';
import { generateCFEntities } from '../../cf-entity-generator';
import { CfUserService } from './cf-user.service';

describe('CfUserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...generateTestCfEndpointServiceProvider(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        provideZonelessChangeDetection(),
      ],
      imports: [
        createBasicStoreModule(),
        EntityCatalogTestModule,
      ],
    });

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('should be created', () => {
    const service = TestBed.inject(CfUserService);
    expect(service).toBeTruthy();
  });
});
