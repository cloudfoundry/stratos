import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EntityCatalogHelper, EntityCatalogHelpers, EntityCatalogTestModuleManualStore, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { createBasicStoreModule, seedEndpointsDataService, STORE_TEST_PROVIDERS, testSCFEndpoint, testSCFEndpointGuid } from '@stratosui/store/testing';
import { EditEndpointStepComponent } from './edit-endpoint-step.component';

describe('EditEndpointStepComponent', () => {
  let component: EditEndpointStepComponent;
  let fixture: ComponentFixture<EditEndpointStepComponent>;
  let activatedRoute: any;

  beforeEach(async () => {
    // Create mutable route object with test endpoint GUID
    activatedRoute = {
      snapshot: {
        params: { id: testSCFEndpointGuid },
        queryParams: {}
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(), // This includes the test endpoint in initial state
        EditEndpointStepComponent,
        EntityCatalogTestModuleManualStore,
      ],
      providers: [
        EntityCatalogHelper,
        {
          provide: ActivatedRoute,
          useValue: activatedRoute
        },
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useFactory: generateStratosEntities
        },
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper AFTER TestBed is configured
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    // Seed the signal-native EndpointsDataService with the endpoint under
    // edit so the component (which reads `endpointsData.endpointsList`) finds
    // it by route id. Replaces the legacy ngrx `store.dispatch` seeding.
    const testEndpointWithClientId = {
      ...testSCFEndpoint,
      guid: testSCFEndpointGuid,
      client_id: '',  // Form expects a string value, not undefined
      skip_ssl_validation: false,
      api_endpoint: {
        Scheme: 'https',
        Opaque: '',
        User: null,
        Host: 'api.test.com',
        Path: '',
        RawPath: '',
        ForceQuery: false,
        RawQuery: '',
        Fragment: ''
      }
    };

    seedEndpointsDataService([testEndpointWithClientId]);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditEndpointStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component) {
      component.ngOnDestroy();
    }
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
