import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
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
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid } from '@stratosui/store/testing';
import { generateCFEntities, generateTestCfEndpointServiceProvider } from '@test-framework/cf';
import { AddOrganizationComponent } from './add-organization.component';
import { CreateOrganizationStepComponent } from "./create-organization-step/create-organization-step.component";

describe('AddOrganizationComponent', () => {
  let component: AddOrganizationComponent;
  let fixture: ComponentFixture<AddOrganizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AddOrganizationComponent,
        CreateOrganizationStepComponent,
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
              params: { endpointId: testSCFEndpointGuid },
              queryParams: {}
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
    fixture = TestBed.createComponent(AddOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
