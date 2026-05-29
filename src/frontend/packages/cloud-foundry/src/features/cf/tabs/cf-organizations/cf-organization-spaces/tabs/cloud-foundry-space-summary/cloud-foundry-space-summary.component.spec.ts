import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  PaginationMonitorFactory,
  EntityMonitorFactory,
  EntityServiceFactory,
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  TabNavService,
  ConfirmationDialogService,
  TailwindSnackBarService,
  
  CoreModule
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import {
  CloudFoundrySpaceServiceMock,
  generateActiveRouteCfOrgSpaceMock,
  generateCfActiveRouteMock
} from '@test-framework/cf';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CfOrgSpaceDataService } from '../../../../../../../shared/data-services/cf-org-space-service.service';
import { UserInviteService, UserInviteConfigureService } from '../../../../../user-invites/user-invite.service';
import { CloudFoundrySpaceSummaryComponent } from './cloud-foundry-space-summary.component';
import { generateCFEntities } from '../../../../../../../cf-entity-generator';

describe('CloudFoundrySpaceSummaryComponent', () => {
  let component: CloudFoundrySpaceSummaryComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceSummaryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        CloudFoundrySpaceSummaryComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        EntityCatalogHelper,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        generateActiveRouteCfOrgSpaceMock(),
        generateCfActiveRouteMock(),
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        CloudFoundryEndpointService,
        CloudFoundryOrganizationService,
        CfOrgSpaceDataService,
        UserInviteService,
        UserInviteConfigureService,
        TabNavService,
        ConfirmationDialogService,
        TailwindSnackBarService,
        ...cfCurrentUserPermissionsService,
        PaginationMonitorFactory,
        EntityMonitorFactory,
        EntityServiceFactory,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();

    // Set EntityCatalogHelper after TestBed is configured
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceSummaryComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid rendering child components
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
