import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
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
import { CustomizationService } from '../../../core/customizations.types';
import { SnackBarService } from '../../../shared/services/snackbar.service';
import { EndpointModalService } from '../endpoint-register-modal/endpoint-modal.service';
import { EndpointsPageComponent } from './endpoints-page.component';

describe('EndpointsPageComponent', () => {
  let component: EndpointsPageComponent;
  let fixture: ComponentFixture<EndpointsPageComponent>;

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
        CurrentUserPermissionsService,
        { provide: SessionService, useValue: mockSessionService },
        { provide: EndpointsService, useValue: mockEndpointsService },
        { provide: CustomizationService, useValue: mockCustomizationService },
        { provide: SnackBarService, useValue: mockSnackBarService },
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

  beforeEach(() => {
    fixture = TestBed.createComponent(EndpointsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
