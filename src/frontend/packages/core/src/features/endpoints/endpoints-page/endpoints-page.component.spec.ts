import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject } from 'rxjs';
import { EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
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
  let perm$: Subject<boolean>;
  let persistence$: Subject<boolean>;
  let customizations: CustomizationsMetadata;

  // Mock services
  const mockSessionService = {
    userEndpointsEnabled: () => of(true),
    userEndpointsNotDisabled: () => of(true),
    isTechPreview: () => of(false)
  };

  const mockEndpointsService = {
    disablePersistenceFeatures$: new Subject<boolean>(),
    haveRegistered$: of(false),
    haveConnected$: of(false),
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
    can: () => of(true)
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
        { provide: EndpointStatusSignalService, useValue: mockEndpointStatusSignals },
        { provide: SessionService, useValue: mockSessionService },
        { provide: EndpointsService, useValue: mockEndpointsService },
        // The real service waits on an endpoints request the test never answers.
        { provide: EndpointStatusSignalService, useValue: { initialised: signal(true) } },
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
    perm$ = new Subject<boolean>();
    persistence$ = new Subject<boolean>();
    mockEndpointsService.disablePersistenceFeatures$ = persistence$;
    customizations = { noEndpointsComponent: null };
    vi.spyOn(TestBed.inject(CurrentUserPermissionsService), 'can').mockReturnValue(perm$);
    fixture = TestBed.createComponent(EndpointsPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('offers Register Endpoint when no endpoints are registered', async () => {
    perm$.next(true);
    await vi.waitFor(() => {
      const add = fixture.nativeElement.querySelector('[data-test="list-sub-nav-add"]');
      expect(add?.textContent).toContain('Register Endpoint');
    });
  });

  it('shows Register when a permission check passes', async () => {
    expect(component.canRegisterEndpoint()).toBe(false);
    perm$.next(true);
    await fixture.whenStable();
    expect(component.canRegisterEndpoint()).toBe(true);
  });

  // The permission streams are long-lived: a subscription that outlives
  // the page holds the destroyed component.
  it('stops watching permissions when destroyed', () => {
    expect(perm$.observed).toBe(true);
    fixture.destroy();
    expect(perm$.observed).toBe(false);
  });

  it('stops waiting for the persistence flag when destroyed', () => {
    expect(persistence$.observed).toBe(true);
    fixture.destroy();
    expect(persistence$.observed).toBe(false);
  });

  // The content waits for isInitialised$, which is delayed by 500ms.
  const renderEmptyPage = async () => {
    const page = TestBed.createComponent(EndpointsPageComponent);
    await page.whenStable();
    await new Promise(resolve => setTimeout(resolve, 600));
    await page.whenStable();
    return page.nativeElement as HTMLElement;
  };

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

  // The open dialog locks the page scroll (body.modal-open); leaving the page
  // with it open must release it.
  it('releases the page scroll when it goes away with the Register dialog open', async () => {
    component.openRegisterModal();
    await fixture.whenStable();
    mockEndpointModalService.closeModal.mockClear();
    fixture.destroy();
    expect(mockEndpointModalService.closeModal).toHaveBeenCalledTimes(1);
  });
});
