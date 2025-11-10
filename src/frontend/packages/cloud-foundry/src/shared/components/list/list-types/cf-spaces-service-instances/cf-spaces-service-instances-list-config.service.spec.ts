import { DatePipe } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { CoreModule, CurrentUserPermissionsService } from '@stratosui/core';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { getCfSpaceServiceMock } from '@test-framework/cloud-foundry-space.service.mock';

import { generateCFEntities } from '../../../../../cf-entity-generator';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { CfSpacesServiceInstancesListConfigService } from "./cf-spaces-service-instances-list-config.service";

describe('CfSpacesServiceInstancesListConfigService', () => {
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
        getCfSpaceServiceMock,
        CfSpacesServiceInstancesListConfigService,
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
    const service = TestBed.inject(CfSpacesServiceInstancesListConfigService);
    expect(service).toBeTruthy();
  });
});
