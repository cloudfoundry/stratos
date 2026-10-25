import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
        createBasicStoreModule(),
        EntityCatalogTestModuleManualStore,
        EndpointCardComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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
      connectionStatus: 'connected',
      // Always present on the wire: jetstream fills creator for every endpoint.
      creator: { name: 'System Endpoint', admin: false, system: true },
    } as EndpointModel;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The card navigated on click only: no link, role or tab stop, so keyboard
  // users could not open the endpoint.
  it('links the title to the endpoint page', async () => {
    await fixture.whenStable();
    const link: HTMLAnchorElement | null = fixture.nativeElement.querySelector('a.endpoint-card__title-link');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/endpoints/metrics/test-endpoint-guid');
    expect(link!.textContent).toContain('Test Metrics Endpoint');
  });

  // The title link is the tab stop; the card itself stays mouse-only so Tab
  // does not land on the same destination twice.
  it('keeps the card itself out of the tab order', async () => {
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-meta-card').getAttribute('tabindex')).not.toBe('0');
  });

  it('shows a plain title when the endpoint has no page to open', async () => {
    fixture.componentRef.setInput('row', { ...component.row, connectionStatus: 'disconnected' } as EndpointModel);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a.endpoint-card__title-link')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Test Metrics Endpoint');
  });
});
