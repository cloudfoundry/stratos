import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  entityCatalog,
  EntityServiceFactory,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityMonitorFactory,
  PaginationMonitorFactory,
  stratosEntityFactory,
  endpointEntityType,
  type NormalizedResponse,
  WrapperRequestActionSuccess,
  EntityCatalogTestModuleManualStore,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, testSCFEndpoint, testSCFEndpointGuid } from '@stratosui/store/testing';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { TabNavService } from '../../../tab-nav.service';
import { EditEndpointComponent } from './edit-endpoint.component';

describe('EditEndpointComponent', () => {
  let component: EditEndpointComponent;
  let fixture: ComponentFixture<EditEndpointComponent>;
  let activatedRoute: { snapshot: { params: { id: string }; queryParams: Record<string, unknown> } };
  let store: Store;

  beforeEach(async () => {
    // Create mutable route object with test endpoint GUID
    activatedRoute = {
      snapshot: {
        params: { id: testSCFEndpointGuid },
        queryParams: { breadcrumbs: '' }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(), // This includes the test endpoint in initial state
        EditEndpointComponent,
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
        TabNavService,
        CurrentUserPermissionsService,
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

    // Create test endpoint with all required properties
    const testEndpointWithAllProps = {
      ...testSCFEndpoint,
      client_id: '',
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
          [testSCFEndpointGuid]: testEndpointWithAllProps
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
    fixture = TestBed.createComponent(EditEndpointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
