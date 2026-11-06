import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityCatalogTestModule, generateStratosEntities, TEST_CATALOGUE_ENTITIES, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CF_BASE_TEST_PROVIDERS } from '@test-framework/cf';
import { generateCFEntities } from '../../../cf-entity-generator';
import { ServicesWallService } from "./services-wall.service";

describe('ServicesWallService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateCFEntities(),
                ...generateStratosEntities(),
              ]
            }
          ]
        },
      ],
      providers: [
        importProvidersFrom(createBasicStoreModule()),
        ...STORE_TEST_PROVIDERS,
        EntityCatalogHelper,
        ...CF_BASE_TEST_PROVIDERS,
        ServicesWallService,
        provideZonelessChangeDetection(),
      ],
    });

    // Initialize EntityCatalogHelper
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('should be created', () => {
    const service = TestBed.inject(ServicesWallService);
    expect(service).toBeTruthy();
  });
});
