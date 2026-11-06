import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { EndpointModel, UserFavoriteManager, entityCatalog, EntityCatalogTestModuleManualStore, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
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

  beforeEach(async () => {
    fixture = TestBed.createComponent(EndpointCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('row', {
      guid: 'test-endpoint-guid',
      cnsi_type: 'metrics',
      name: 'Test Metrics Endpoint',
      connectionStatus: 'connected',
      // Always present on the wire: jetstream fills creator for every endpoint.
      creator: { name: 'System Endpoint', admin: false, system: true },
    } as EndpointModel);
    await fixture.whenStable();
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
    fixture.componentRef.setInput('row', { ...component.row(), connectionStatus: 'disconnected' } as EndpointModel);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a.endpoint-card__title-link')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Test Metrics Endpoint');
  });

  describe('the type\'s picture', () => {
    const picture = (definition: object) => {
      const getEndpoint = vi.spyOn(entityCatalog, 'getEndpoint')
        .mockReturnValue({ definition: { label: 'Test type', unConnectable: true, ...definition } } as never);
      fixture.componentRef.setInput('row', { ...component.row(), cnsi_type: 'test-type' } as EndpointModel);
      return getEndpoint;
    };
    const wrapper = () => fixture.nativeElement.querySelector('.endpoint-card__image-wrapper') as HTMLElement | null;

    // A type with no image file, such as the autoscaler, has only a font icon.
    it('draws the font icon when the type has no image', async () => {
      const getEndpoint = picture({ logoUrl: '', icon: 'meter', iconFont: 'stratos-icons' });
      await fixture.whenStable();
      expect(wrapper()!.querySelector('img')).toBeNull();
      const icon = wrapper()!.querySelector('i.stratos-icons');
      expect(icon?.textContent?.trim()).toBe('meter');
      expect(icon!.closest('app-custom-icon')!.classList).toContain('text-[40px]');
      getEndpoint.mockRestore();
    });

    it('prefers the image when the type has both', async () => {
      const getEndpoint = picture({ logoUrl: '/logo.png', icon: 'meter', iconFont: 'stratos-icons' });
      await fixture.whenStable();
      expect(wrapper()!.querySelector('img')?.getAttribute('src')).toBe('/logo.png');
      expect(wrapper()!.querySelector('i.stratos-icons')).toBeNull();
      getEndpoint.mockRestore();
    });

    it('leaves the space out when the type has neither', async () => {
      const getEndpoint = picture({ logoUrl: '' });
      await fixture.whenStable();
      expect(wrapper()).toBeNull();
      getEndpoint.mockRestore();
    });
  });
});
