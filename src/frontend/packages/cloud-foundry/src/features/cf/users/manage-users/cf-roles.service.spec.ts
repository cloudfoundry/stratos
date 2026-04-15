import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import {
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers,
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateTestCfEndpointServiceProvider } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { generateCFEntities } from '../../../../cf-entity-generator';
import { CfRolesService } from './cf-roles.service';

describe('CfRolesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogTestModule,
      ],
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
        CfRolesService,
        ...cfCurrentUserPermissionsService,
        provideZonelessChangeDetection(),
      ]
    });

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('should be created', () => {
    const service = TestBed.inject(CfRolesService);
    expect(service).toBeTruthy();
  });
});
