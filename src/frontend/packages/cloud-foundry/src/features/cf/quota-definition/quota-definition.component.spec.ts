import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { StoreModule } from '@ngrx/store';

import { TabNavService, CurrentUserPermissionsService } from '@stratosui/core';
import {
  appReducers,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogTestModule,
  EntityServiceFactory,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { generateTestCfEndpointServiceProvider } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { generateCFEntities } from '@stratosui/cloud-foundry';
import { QuotaDefinitionComponent } from "./quota-definition.component";

describe('QuotaDefinitionComponent', () => {
  let component: QuotaDefinitionComponent;
  let fixture: ComponentFixture<QuotaDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        QuotaDefinitionComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          StoreModule.forRoot(appReducers, {
            runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
          }),
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        EntityServiceFactory,
        CurrentUserPermissionsService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { cfGuid: testSCFEndpointGuid },
              params: { quotaId: 'guid' }
            }
          }
        },
        ...generateTestCfEndpointServiceProvider(),
        TabNavService,
      ]
    }).compileComponents();

    // Initialize Entity Catalog Helper AFTER compileComponents
    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);

    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuotaDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
