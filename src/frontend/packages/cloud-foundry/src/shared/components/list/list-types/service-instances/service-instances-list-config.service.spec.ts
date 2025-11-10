import { DatePipe } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { CoreModule, CurrentUserPermissionsService } from '@stratosui/core';
import {
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities, ServiceActionHelperService } from '@stratosui/cloud-foundry';

import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { ServiceInstancesListConfigService } from './service-instances-list-config.service';

class ServicesServiceMock {
  cfGuid = 'test-cf-guid';
  serviceGuid = 'test-service-guid';
}

describe('ServiceInstancesListConfigService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        EntityCatalogHelper,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ServiceInstancesListConfigService,
        { provide: ServicesService, useClass: ServicesServiceMock },
        DatePipe,
        ServiceActionHelperService,
        CurrentUserPermissionsService,
      ],
    });

    // Initialize EntityCatalogHelper manually
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('should be created', () => {
    const service = TestBed.inject(ServiceInstancesListConfigService);
    expect(service).toBeTruthy();
  });
});
