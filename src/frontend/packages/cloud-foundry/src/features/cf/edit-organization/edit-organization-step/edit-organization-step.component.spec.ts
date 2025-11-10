import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CurrentUserPermissionsService } from '@stratosui/core';
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
import { generateCFEntities, generateTestCfEndpointServiceProvider, CloudFoundryOrganizationServiceMock } from '@test-framework/cf';
import { CloudFoundryOrganizationService } from '../../services/cloud-foundry-organization.service';
import { CloudFoundryUserProvidedServicesService } from '../../../../shared/services/cloud-foundry-user-provided-services.service';
import { EditOrganizationStepComponent } from './edit-organization-step.component';

describe('EditOrganizationStepComponent', () => {
  let component: EditOrganizationStepComponent;
  let fixture: ComponentFixture<EditOrganizationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditOrganizationStepComponent,
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
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        CloudFoundryUserProvidedServicesService,
      ]
    })
      .compileComponents();

    // Initialize Entity Catalog Helper AFTER compileComponents
    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditOrganizationStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
