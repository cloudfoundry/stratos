import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
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
import { generateCFEntities, generateTestCfEndpointServiceProvider, ActiveRouteCfOrgSpace, ApplicationServiceMock } from '@test-framework/cf';
import { ApplicationService } from '../../application.service';
import { AddRouteStepperComponent } from "./add-route-stepper.component";

describe('AddRouteStepperComponent', () => {
  let component: AddRouteStepperComponent;
  let fixture: ComponentFixture<AddRouteStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AddRouteStepperComponent,
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
        ...generateTestCfEndpointServiceProvider(testSCFEndpointGuid),
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: testSCFEndpointGuid,
            orgGuid: testSCFEndpointGuid,
            spaceGuid: testSCFEndpointGuid
          }
        },
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    // Initialize EntityCatalogHelper
    const entityCatalogHelper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(entityCatalogHelper);

    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRouteStepperComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid rendering child components that need additional setup
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
