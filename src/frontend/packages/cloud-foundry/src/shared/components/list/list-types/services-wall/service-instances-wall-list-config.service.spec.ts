import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import {
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { generateASEntities } from '@stratosui/cf-autoscaler';
import { CfOrgSpaceDataService, ServiceActionHelperService, generateCFEntities } from '@stratosui/cloud-foundry';
import { CurrentUserPermissionsService, CoreModule } from '@stratosui/core';
import { generateTestCfEndpointService } from '@test-framework/cf';
import { ServiceInstancesWallListConfigService } from './service-instances-wall-list-config.service';

describe('ServiceInstancesWallListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EntityCatalogTestModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
            ...generateASEntities(),
          ]
        },
        EntityCatalogHelper,
        importProvidersFrom(createBasicStoreModule(), CoreModule),
        ...generateTestCfEndpointService(),
        ServiceInstancesWallListConfigService,
        CfOrgSpaceDataService,
        DatePipe,
        ServiceActionHelperService,
        CurrentUserPermissionsService,
      ],
    });

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('should be created', () => {
    const service = TestBed.inject(ServiceInstancesWallListConfigService);
    expect(service).toBeTruthy();
  });
});
