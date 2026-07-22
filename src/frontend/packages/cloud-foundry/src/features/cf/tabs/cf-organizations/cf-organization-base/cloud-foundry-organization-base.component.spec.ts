import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';

import {
  TabNavService,
  CoreModule
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../../../cf-entity-generator';
import { OrgDataService } from '../../../../../services/endpoint-data/org-data.service';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationBaseComponent } from "./cloud-foundry-organization-base.component";

describe('CloudFoundryOrganizationBaseComponent', () => {
  let component: CloudFoundryOrganizationBaseComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationBaseComponent>;

  const mockOrgService = {
    cfGuid: 'cf-guid',
    orgGuid: 'org-guid',
    org$: of({
      entity: {
        entity: {
          name: 'test-org',
          guid: 'org-guid',
          spaces: [],
          cfGuid: 'cf-guid'
        },
        metadata: {
          guid: 'org-guid'
        }
      },
      entityRequestInfo: {
        fetching: false,
        error: false,
        deleting: { busy: false, deleted: false }
      }
    })
  };

  const mockEndpointService = {
    cfGuid: 'cf-guid',
    endpoint$: of({
      entity: {
        guid: 'cf-guid',
        name: 'Test CF',
        api_endpoint: { Host: 'api.example.com' }
      }
    })
  };

  const mockActiveRoute = {
    cfGuid: 'cf-guid',
    orgGuid: 'org-guid',
    spaceGuid: 'space-guid'
  };

  // Minimal OrgDataService stand-in: only the methods the base component
  // touches (load() in ngOnInit, org() in template). Bypasses the registry
  // so the test doesn't need to wire HttpClient against the native handler.
  const mockOrgDataService = {
    org: () => null,
    isLoading: signal(false),
    load: () => of(undefined),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        CloudFoundryOrganizationBaseComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        EntityCatalogHelper,
        { provide: ActiveRouteCfOrgSpace, useValue: mockActiveRoute },
        { provide: CloudFoundryOrganizationService, useValue: mockOrgService },
        { provide: CloudFoundryEndpointService, useValue: mockEndpointService },
        TabNavService,
        ...cfCurrentUserPermissionsService,
      ]
    })
    .overrideComponent(CloudFoundryOrganizationBaseComponent, {
      set: {
        providers: [
          { provide: CloudFoundryOrganizationService, useValue: mockOrgService },
          { provide: CloudFoundryEndpointService, useValue: mockEndpointService },
          { provide: OrgDataService, useValue: mockOrgDataService },
        ]
      }
    });

    // Set EntityCatalogHelper after TestBed is configured
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
