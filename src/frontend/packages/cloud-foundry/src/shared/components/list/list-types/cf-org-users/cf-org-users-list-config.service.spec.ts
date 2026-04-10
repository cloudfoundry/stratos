import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  cfCurrentUserPermissionsService} from '@stratosui/cloud-foundry';
import {
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers,
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  generateTestCfEndpointServiceProvider,
  CloudFoundryOrganizationServiceMock,
  CloudFoundrySpaceServiceMock
} from '@test-framework/cf';
import { generateCFEntities } from '../../../../../cf-entity-generator';
import { CloudFoundryOrganizationService } from '../../../../../features/cf/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { CfOrgUsersListConfigService } from './cf-org-users-list-config.service';

describe('CfOrgUsersListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogTestModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        ...generateTestCfEndpointServiceProvider(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        {
          provide: CfOrgUsersListConfigService,
          useFactory: () => new CfOrgUsersListConfigService(),
        },
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        ...cfCurrentUserPermissionsService,
      ]
    });

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('should be created', () => {
    const service = TestBed.inject(CfOrgUsersListConfigService);
    expect(service).toBeTruthy();
  });
});
