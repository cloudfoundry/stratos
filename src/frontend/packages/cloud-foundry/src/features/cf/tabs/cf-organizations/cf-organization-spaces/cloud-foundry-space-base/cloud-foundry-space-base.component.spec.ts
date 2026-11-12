import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';

import { TabNavService, CoreModule, ConfirmationDialogService, TailwindSnackBarService } from '@stratosui/core';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../../../../cf-entity-generator';
import { ActiveRouteCfOrgSpace } from '../../../../cf-page.types';
import { CloudFoundrySpaceService } from '../../../../services/cloud-foundry-space.service';
import { CloudFoundryOrganizationService } from '../../../../services/cloud-foundry-organization.service';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { SpaceDataService } from '../../../../../../services/endpoint-data/space-data.service';
import { CloudFoundrySpaceBaseComponent } from './cloud-foundry-space-base.component';

describe('CloudFoundrySpaceBaseComponent', () => {
  let component: CloudFoundrySpaceBaseComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceBaseComponent>;

  const mockSpaceDataService = {
    space: signal(null),
    isLoading: signal(false),
    load: () => of(undefined),
  };

  // The CLI menu in the sub-nav reads the space's name.
  const mockSpaceService = {
    cfGuid: 'cf-guid',
    orgGuid: 'org-guid',
    spaceGuid: 'space-guid',
    spaceDataService: mockSpaceDataService,
  };

  const org = signal<{ guid: string, name: string } | null>(null);
  const mockOrgService = {
    cfGuid: 'cf-guid',
    orgGuid: 'org-guid',
    orgDataService: { org },
  };

  const mockEndpointService = {
    cfGuid: 'cf-guid',
    endpoint: signal({
      entity: {
        guid: 'cf-guid',
        name: 'Test CF',
        api_endpoint: { Host: 'api.example.com' }
      }
    }),
  };

  const mockActiveRoute = {
    cfGuid: 'cf-guid',
    orgGuid: 'org-guid',
    spaceGuid: 'space-guid'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        CloudFoundrySpaceBaseComponent,
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
        provideHttpClientTesting(),
        { provide: ActiveRouteCfOrgSpace, useValue: mockActiveRoute },
        { provide: CloudFoundrySpaceService, useValue: mockSpaceService },
        { provide: CloudFoundryOrganizationService, useValue: mockOrgService },
        { provide: CloudFoundryEndpointService, useValue: mockEndpointService },
        TabNavService,
        ConfirmationDialogService,
        TailwindSnackBarService,
      ]
    })
      .overrideComponent(CloudFoundrySpaceBaseComponent, {
        set: {
          providers: [
            { provide: CloudFoundrySpaceService, useValue: mockSpaceService },
            { provide: CloudFoundryOrganizationService, useValue: mockOrgService },
            { provide: SpaceDataService, useValue: mockSpaceDataService },
          ]
        }
      })
      .compileComponents();

    // Set EntityCatalogHelper after TestBed is configured
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Both crumbs wait for the org: the space page names its org.
  it('links back to the endpoint\'s organizations and the org\'s spaces once the org is in', () => {
    expect(component.breadcrumbs()).toBeNull();
    org.set({ guid: 'org-guid', name: 'test-org' });
    expect(component.breadcrumbs()?.[0].breadcrumbs).toEqual([
      { value: 'Test CF', routerLink: '/cloud-foundry/cf-guid/organizations' },
      { value: 'test-org', routerLink: '/cloud-foundry/cf-guid/organizations/org-guid/spaces' },
    ]);
    org.set(null);
  });
});
