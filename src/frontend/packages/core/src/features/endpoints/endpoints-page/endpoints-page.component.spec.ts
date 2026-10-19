import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
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
import { CustomizationService } from '../../../core/customizations.types';
import { TailwindSnackBarService } from '../../../shared/services/tailwind-snackbar.service';
import { EndpointModalService } from '../endpoint-register-modal/endpoint-modal.service';
import { EndpointsPageComponent } from './endpoints-page.component';

describe('EndpointsPageComponent', () => {
  let component: EndpointsPageComponent;
  let fixture: ComponentFixture<EndpointsPageComponent>;
  let perm$: Subject<boolean>;

  // Mock services
  const mockSessionService = {
    userEndpointsEnabled: () => of(true),
    userEndpointsNotDisabled: () => of(true),
    isTechPreview: () => of(false)
  };

  const mockEndpointsService = {
    disablePersistenceFeatures$: of(false),
    haveRegistered$: of(false),
    haveConnected$: of(false),
    checkAllEndpoints: vi.fn()
  };

  const mockCustomizationService = {
    get: () => ({
      noEndpointsComponent: null
    })
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
});
