import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  appReducers,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogTestModule,
  EntityCatalogHelper,
  EntityCatalogHelpers,
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { generateTestCfEndpointServiceProvider } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { generateCFEntities } from '@stratosui/cloud-foundry';
import { CreateOrganizationStepComponent } from "./create-organization-step.component";

describe('CreateOrganizationStepComponent', () => {
  let component: CreateOrganizationStepComponent;
  let fixture: ComponentFixture<CreateOrganizationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
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
        ...generateTestCfEndpointServiceProvider(testSCFEndpointGuid),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper
    const entityCatalogHelper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(entityCatalogHelper);

    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateOrganizationStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
