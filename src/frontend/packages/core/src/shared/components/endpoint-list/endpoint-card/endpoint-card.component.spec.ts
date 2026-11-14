import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { EndpointModel, UserFavoriteManager, entityCatalog, EntityCatalogTestModuleManualStore, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CurrentUserPermissionsService } from '@stratosui/core';
import { SessionSignalService } from '../../../../core/signals/session-signal.service';
import { StratosCurrentUserPermissions } from '../../../../core/permissions/stratos-user-permissions.checker';
import { EndpointListHelper } from '../endpoint-list.helpers';
import { EndpointCardComponent } from './endpoint-card.component';
import { MetricsService } from '../../../../features/metrics/services/metrics-service';

describe('EndpointCardComponent', () => {
  let component: EndpointCardComponent;
  let fixture: ComponentFixture<EndpointCardComponent>;
  const sessionSignals = { userEndpointsEnabled: signal(true), userEndpointsNotDisabled: signal(true) };

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
          provide: SessionSignalService,
          useValue: sessionSignals
        },
        {
          provide: CurrentUserPermissionsService,
          useValue: {
            can: () => signal(true)
          }
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(async () => {
    sessionSignals.userEndpointsEnabled.set(true);
    sessionSignals.userEndpointsNotDisabled.set(true);
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

  // The creator shows to an admin; it follows the permission.
  it('shows the creator only to an admin', async () => {
    const isAdmin = signal(false);
    vi.spyOn(TestBed.inject(CurrentUserPermissionsService), 'can').mockReturnValue(isAdmin);
    const card = TestBed.createComponent(EndpointCardComponent);
    card.componentRef.setInput('row', component.row());
    await card.whenStable();
    const text = () => (card.nativeElement as HTMLElement).textContent ?? '';
    expect(text()).not.toContain('Creator');

    isAdmin.set(true);
    await card.whenStable();
    expect(text()).toContain('Creator');
  });

  // An endpoint admin sees the creator while user endpoints are enabled.
  // The card kept the setting's first answer.
  it('shows the creator to an endpoint admin while user endpoints are enabled', async () => {
    sessionSignals.userEndpointsEnabled.set(false);
    TestBed.tick();
    vi.spyOn(TestBed.inject(CurrentUserPermissionsService), 'can')
      .mockImplementation(((p: string) => signal(p === StratosCurrentUserPermissions.EDIT_ENDPOINT)) as never);
    const card = TestBed.createComponent(EndpointCardComponent);
    card.componentRef.setInput('row', component.row());
    await card.whenStable();
    const text = () => (card.nativeElement as HTMLElement).textContent ?? '';
    expect(text()).not.toContain('Creator');

    sessionSignals.userEndpointsEnabled.set(true);
    await card.whenStable();
    expect(text()).toContain('Creator');
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
