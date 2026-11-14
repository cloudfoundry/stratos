import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthDataService, EndpointsDataService, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../core/core.module';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { SidePanelService } from './../../../shared/services/side-panel.service';
import { SessionService } from '../../../shared/services/session.service';
import { EndpointsService } from '../../../core/endpoints.service';
import { EndpointStatusSignalService } from '../../../core/signals/endpoint-status-signal.service';
import { CustomizationService, CustomizationsMetadata } from '../../../core/customizations.types';
import { TailwindSnackBarService } from '../../../shared/services/tailwind-snackbar.service';
import { EndpointModalService } from '../endpoint-register-modal/endpoint-modal.service';
import { EndpointRegisterModalComponent } from '../endpoint-register-modal/endpoint-register-modal.component';
import { EndpointsPageComponent } from './endpoints-page.component';

@Component({ selector: 'app-test-welcome', template: '<p class="test-welcome">Welcome</p>' })
class TestWelcomeComponent {}

describe('EndpointsPageComponent', () => {
  let component: EndpointsPageComponent;
  let fixture: ComponentFixture<EndpointsPageComponent>;
  let perm: WritableSignal<boolean>;
  let customizations: CustomizationsMetadata;

  // Mock services
  const mockSessionService = {
    userEndpointsEnabled: () => of(true),
    userEndpointsNotDisabled: () => of(true),
    isTechPreview: () => of(false)
  };

  const mockEndpointsService = {
    haveRegistered: signal(false),
    haveConnected: signal(false),
    disablePersistenceFeatures: signal(false),
    checkAllEndpoints: vi.fn()
  };

  const mockCustomizationService = {
    get: () => customizations
  };

  const mockSnackBarService = {
    show: vi.fn(),
    hide: vi.fn()
  };

  const mockPermissionsService = {
    can: () => signal(true)
  };

  const mockEndpointStatusSignals = {
    initialised: signal(true)
  };

  const mockEndpointModalService = {
    openModal: vi.fn(),
    closeModal: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CoreTestingModule,
        createBasicStoreModule(),
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        EndpointsPageComponent,
      ],
      providers: [
        TabNavService,
        SidePanelService,
        { provide: CurrentUserPermissionsService, useValue: mockPermissionsService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: EndpointsService, useValue: mockEndpointsService },
        // The real service waits on an endpoints request the test never answers.
        { provide: EndpointStatusSignalService, useValue: mockEndpointStatusSignals },
        { provide: CustomizationService, useValue: mockCustomizationService },
        { provide: TailwindSnackBarService, useValue: mockSnackBarService },
        { provide: EndpointModalService, useValue: mockEndpointModalService },
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    // Set up entity catalog helper from DI after module compilation
    // Entity catalog is initialized synchronously by EntityCatalogFeatureModule during compilation
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(async () => {
    perm = signal(false);
    mockEndpointStatusSignals.initialised.set(true);
    mockEndpointsService.haveRegistered.set(false);
    mockEndpointsService.haveConnected.set(false);
    mockEndpointsService.disablePersistenceFeatures.set(false);
    mockSnackBarService.show.mockClear();
    customizations = { noEndpointsComponent: null };
    vi.spyOn(TestBed.inject(CurrentUserPermissionsService), 'can').mockReturnValue(perm);
    fixture = TestBed.createComponent(EndpointsPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('offers Register Endpoint when no endpoints are registered', async () => {
    perm.set(true);
    await vi.waitFor(() => {
      const add = fixture.nativeElement.querySelector('[data-test="list-sub-nav-add"]');
      expect(add?.textContent).toContain('Register Endpoint');
    });
  });

  it('shows Register when a permission check passes', async () => {
    expect(component.canRegisterEndpoint()).toBe(false);
    perm.set(true);
    await fixture.whenStable();
    expect(component.canRegisterEndpoint()).toBe(true);
  });

  // Backup and restore need the backend plugin and the admin permission;
  // the session may arrive after the page.
  it('offers backup and restore once the session has the plugin', () => {
    perm.set(true);
    expect(component.canBackupRestore()).toBe(false);
    (TestBed.inject(AuthDataService) as any)._auth.update((s: object) => ({ ...s, sessionData: { plugins: { backup: true } } }));
    expect(component.canBackupRestore()).toBe(true);
    perm.set(false);
    expect(component.canBackupRestore()).toBe(false);
  });

  it('tells the user when endpoints are registered but none are connected', async () => {
    mockEndpointsService.haveRegistered.set(true);
    mockSnackBarService.show.mockClear();
    const page = TestBed.createComponent(EndpointsPageComponent);
    await page.whenStable();
    expect(mockSnackBarService.show).toHaveBeenCalledWith(
      expect.stringContaining('There are no connected endpoints'), 'Got it', 20000);
  });

  it('sends the user to applications when persistence is off', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    mockEndpointsService.disablePersistenceFeatures.set(true);
    const page = TestBed.createComponent(EndpointsPageComponent);
    await page.whenStable();
    expect(navigate).toHaveBeenCalledWith(['applications'], { replaceUrl: true });
  });

  const renderEmptyPage = async () => {
    const page = TestBed.createComponent(EndpointsPageComponent);
    await page.whenStable();
    return page.nativeElement as HTMLElement;
  };

  // The page showed neither the loader nor the content for the first
  // 500 ms, and lagged 500 ms behind every later change.
  it('shows the content right away once the endpoints are loaded', async () => {
    const el = await renderEmptyPage();
    expect(el.querySelector('app-area-loader')).toBeNull();
    expect(el.querySelector('app-endpoints-missing')).not.toBeNull();
  });

  it('shows the loader right away while the endpoints load, then the content', async () => {
    mockEndpointStatusSignals.initialised.set(false);
    const page = TestBed.createComponent(EndpointsPageComponent);
    await page.whenStable();
    const el = page.nativeElement as HTMLElement;
    expect(el.querySelector('app-area-loader')).not.toBeNull();
    expect(el.querySelector('app-endpoints-missing')).toBeNull();

    mockEndpointStatusSignals.initialised.set(true);
    await page.whenStable();
    expect(el.querySelector('app-area-loader')).toBeNull();
    expect(el.querySelector('app-endpoints-missing')).not.toBeNull();
  });

  it('shows the default message with no endpoints', async () => {
    const el = await renderEmptyPage();
    expect(el.querySelector('app-endpoints-missing')).not.toBeNull();
  });

  it('shows a custom no-endpoints component in place of the message', async () => {
    customizations = { noEndpointsComponent: TestWelcomeComponent };
    const el = await renderEmptyPage();
    expect(el.querySelector('.test-welcome')?.textContent).toBe('Welcome');
    expect(el.querySelector('app-endpoints-missing')).toBeNull();
  });

  // The Register Endpoint dialog reports a registration when its form is
  // done; the page refreshes and closes the dialog. The form already said
  // "Successfully registered '<name>'" when the endpoint was registered, so
  // the page adds no second message.
  it('closes the Register dialog when an endpoint was registered', async () => {
    mockSnackBarService.show.mockClear();
    mockEndpointModalService.closeModal.mockClear();
    component.openRegisterModal();
    await fixture.whenStable();
    const modal = fixture.debugElement.query(By.directive(EndpointRegisterModalComponent));
    expect(modal).not.toBeNull();

    (modal.componentInstance as EndpointRegisterModalComponent).endpointRegistered.emit();
    await fixture.whenStable();

    expect(fixture.debugElement.query(By.directive(EndpointRegisterModalComponent))).toBeNull();
    expect(mockEndpointModalService.closeModal).toHaveBeenCalledTimes(1);
    expect(mockSnackBarService.show).not.toHaveBeenCalledWith('Endpoint registered successfully!', 'OK', 5000);
  });

  // The page's own "no connected endpoints" message is the only one it may
  // clear: the Register form's "Successfully registered '<name>'" arrives
  // just before the endpoints update, and hide() would dismiss it too.
  it('leaves messages it did not open alone', async () => {
    mockSnackBarService.hide.mockClear();
    fixture.destroy();
    expect(mockSnackBarService.hide).not.toHaveBeenCalled();
  });

  // The open dialog locks the page scroll (body.modal-open); leaving the page
  // with it open must release it.
  it('releases the page scroll when it goes away with the Register dialog open', async () => {
    component.openRegisterModal();
    await fixture.whenStable();
    mockEndpointModalService.closeModal.mockClear();
    fixture.destroy();
    expect(mockEndpointModalService.closeModal).toHaveBeenCalledTimes(1);
  });
  // The pulse checked the endpoint list the page loaded when it opened. After
  // the server dropped a connection the page still said Connected, so every
  // tick fetched /pp/v1/cf/info and got 403 "no token for endpoint" (76 times
  // in 38 minutes on the lab).
  it('re-reads the endpoint list before each health check tick', async () => {
    vi.useFakeTimers();
    try {
      const order: string[] = [];
      const getAll = vi.spyOn(TestBed.inject(EndpointsDataService), 'getAll')
        .mockImplementation(async () => { order.push('getAll'); return []; });
      mockEndpointsService.checkAllEndpoints.mockImplementation(() => { order.push('check'); });
      getAll.mockClear();
      order.length = 0;

      (component as unknown as { startEndpointHealthCheckPulse(): void }).startEndpointHealthCheckPulse();
      await vi.advanceTimersByTimeAsync(30000);

      expect(order).toEqual(['getAll', 'check']);
      expect(getAll).toHaveBeenCalledWith(false);
    } finally {
      fixture.destroy();
      mockEndpointsService.checkAllEndpoints.mockReset();
      vi.useRealTimers();
    }
  });
});
