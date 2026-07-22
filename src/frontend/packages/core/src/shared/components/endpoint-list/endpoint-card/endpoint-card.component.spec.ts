import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { EndpointModel, UserFavoriteManager, EntityCatalogTestModuleManualStore, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CurrentUserPermissionsService, SessionService } from '@stratosui/core';
import { EndpointListHelper } from '../endpoint-list.helpers';
import { EndpointCardComponent } from './endpoint-card.component';
import { MetricsService } from '../../../../features/metrics/services/metrics-service';

describe('EndpointCardComponent', () => {
  let component: EndpointCardComponent;
  let fixture: ComponentFixture<EndpointCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientModule,
        createBasicStoreModule(),
        EntityCatalogTestModuleManualStore,
        EndpointCardComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: generateStratosEntities()
        },
        EndpointListHelper,
        UserFavoriteManager,
        {
          provide: MetricsService,
          useValue: {
            metricsEndpoints$: of([]),
            haveNoMetricsEndpoints$: of(false),
            haveNoConnectedMetricsEndpoints$: of(false)
          }
        },
        {
          provide: SessionService,
          useValue: {
            userEndpointsEnabled: () => of(true),
            userEndpointsNotDisabled: () => of(true)
          }
        },
        {
          provide: CurrentUserPermissionsService,
          useValue: {
            can: () => of(true)
          }
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EndpointCardComponent);
    component = fixture.componentInstance;
    component.row = {
      guid: 'test-endpoint-guid',
      cnsi_type: 'metrics',
      name: 'Test Metrics Endpoint',
      connectionStatus: 'connected'
    } as EndpointModel;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
