import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  type AppState,
  type BaseEntityValues,
  entityCatalog,
  EntityServiceFactory,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  PaginationMonitorFactory,
  EntityMonitorFactory,
  stratosEntityFactory,
  endpointEntityType,
  type NormalizedResponse,
  WrapperRequestActionSuccess,
  EntityCatalogTestModuleManualStore,
  TEST_CATALOGUE_ENTITIES
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, testSCFEndpoint, testSCFEndpointGuid } from '@stratosui/store/testing';
import { EditEndpointStepComponent } from './edit-endpoint-step.component';

describe('EditEndpointStepComponent', () => {
  let component: EditEndpointStepComponent;
  let fixture: ComponentFixture<EditEndpointStepComponent>;
  let activatedRoute: { snapshot: { params: { id: string }; queryParams: Record<string, unknown> } };
  let store: Store<AppState<BaseEntityValues & Record<string, unknown>>>;

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
        EntityServiceFactory,
        EntityCatalogHelper,
        PaginationMonitorFactory,
        EntityMonitorFactory,
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

    // Get store and dispatch endpoint data to populate pagination
    store = TestBed.inject(Store);
    const stratosEndpointEntityConfig = stratosEntityFactory(endpointEntityType);
    const stratosEndpointEntityKey = entityCatalog.getEntityKey(stratosEndpointEntityConfig);

    // Create test endpoint with all required properties for the form
    const testEndpointWithClientId = {
      ...testSCFEndpoint,
      client_id: '',  // Form expects a string value, not undefined
      skip_ssl_validation: false,
      api_endpoint: {
        Scheme: 'https',
        Opaque: '',
        User: null as unknown,
        Host: 'api.test.com',
        Path: '',
        RawPath: '',
        ForceQuery: false,
        RawQuery: '',
        Fragment: ''
      }
    };

    const mappedData = {
      entities: {
        [stratosEndpointEntityKey]: {
          [testSCFEndpointGuid]: testEndpointWithClientId
        }
      },
      result: [testSCFEndpointGuid]
    } as NormalizedResponse;

    store.dispatch(new WrapperRequestActionSuccess(mappedData, {
      type: 'GET_ALL',
      paginationKey: 'endpoint-list',
      ...stratosEndpointEntityConfig
    }, 'fetch', 1, 1));
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
