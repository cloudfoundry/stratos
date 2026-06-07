import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import {
  TabNavService
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { EntityCatalogHelpers, EntityCatalogHelper, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid } from '@stratosui/store/testing';
import { generateTestCfEndpointServiceProvider } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { generateCFEntities } from '@test-framework/cf';
import { SpaceQuotaDefinitionComponent } from './space-quota-definition.component';

describe('SpaceQuotaDefinitionComponent', () => {
  let component: SpaceQuotaDefinitionComponent;
  let fixture: ComponentFixture<SpaceQuotaDefinitionComponent>;
  const cfGuid = testSCFEndpointGuid;
  const orgGuid = '123';
  const spaceGuid = '123';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SpaceQuotaDefinitionComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        ...cfCurrentUserPermissionsService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { cfGuid, orgGuid, spaceGuid },
              params: { quotaId: 'guid' }
            }
          }
        },
        generateTestCfEndpointServiceProvider(),
        TabNavService,
      ]

    })
      .compileComponents();

    // Initialize Entity Catalog Helper AFTER compileComponents
    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceQuotaDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
