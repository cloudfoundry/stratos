import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
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
import { CloudFoundrySpaceBaseComponent } from './cloud-foundry-space-base.component';

describe('CloudFoundrySpaceBaseComponent', () => {
  let component: CloudFoundrySpaceBaseComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceBaseComponent>;

  const mockSpaceService = {
    cfGuid: 'cf-guid',
    orgGuid: 'org-guid',
    spaceGuid: 'space-guid',
    space$: of({
      entity: {
        entity: {
          name: 'test-space',
          guid: 'space-guid',
          space_quota_definition: null
        },
        metadata: {
          guid: 'space-guid'
        }
      },
      entityRequestInfo: {
        fetching: false,
        error: false,
        deleting: { busy: false, deleted: false }
      }
    })
  };

  const mockOrgService = {
    cfGuid: 'cf-guid',
    orgGuid: 'org-guid',
    org$: of({
      entity: {
        entity: {
          name: 'test-org',
          guid: 'org-guid'
        },
        metadata: {
          guid: 'org-guid'
        }
      },
      entityRequestInfo: {
        fetching: false,
        error: false
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
    }),
    currentUser$: of({
      guid: 'user-guid',
      name: 'test-user',
      admin: false
    }),
    appsPagObs: {
      hasEntities$: of(true),
      fetchingEntities$: of(false)
    },
    getAppsInOrgViaAllApps: () => of([]),
    getMetricFromApps: () => 0,
    fetchApps: () => {}
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
        { provide: ActiveRouteCfOrgSpace, useValue: mockActiveRoute },
        { provide: CloudFoundrySpaceService, useValue: mockSpaceService },
        { provide: CloudFoundryOrganizationService, useValue: mockOrgService },
        { provide: CloudFoundryEndpointService, useValue: mockEndpointService },
        TabNavService,
        ConfirmationDialogService,
        TailwindSnackBarService,
      ]
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
});
