import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EndpointsDataService, EntityCatalogHelper, EntityCatalogHelpers, EntityCatalogTestModuleManualStore, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule, testSCFEndpoint, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { signal } from '@angular/core';
import { CurrentUserPermissionsService } from '../../../../core/permissions/current-user-permissions.service';
import { TabNavService } from '../../../../tab-nav.service';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { BackupEndpointsComponent } from './backup-endpoints.component';

describe('BackupEndpointsComponent', () => {
  let component: BackupEndpointsComponent;
  let fixture: ComponentFixture<BackupEndpointsComponent>;
  const hydrated = signal(true);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        NoopAnimationsModule,
        BackupEndpointsComponent,
        {
          ngModule: EntityCatalogTestModuleManualStore,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateStratosEntities(),
              ]
            }
          ]
        },
      ],
      providers: [
        TabNavService,
        CurrentUserPermissionsService,
        {
          provide: ConfirmationDialogService,
          useValue: {
            open: vi.fn(),
            openWithCancel: vi.fn()
          }
        },
        ...STORE_TEST_PROVIDERS,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });

    // Set up entity catalog helper from DI
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    // Seed the EndpointsDataService signals with a test endpoint, loaded.
    const endpointsData = TestBed.inject(EndpointsDataService);
    hydrated.set(true);
    const endpointsListSignal = signal([testSCFEndpoint]);
    Object.defineProperty(endpointsData, 'endpointsList', { value: endpointsListSignal });
    Object.defineProperty(endpointsData, 'loading', { value: signal(false) });
    Object.defineProperty(endpointsData, 'hydrated', { value: hydrated });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupEndpointsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Clean up component and subscriptions
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The selections start from the loaded endpoints; the Select buttons
  // follow what is selected.
  it('starts from the loaded endpoints and enables Select All / None by what is selected', async () => {
    hydrated.set(false);
    fixture = TestBed.createComponent(BackupEndpointsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    expect(component.service.state[testSCFEndpoint.guid!]).toBeUndefined();

    hydrated.set(true);
    await fixture.whenStable();
    expect(component.service.state[testSCFEndpoint.guid!]).toBeDefined();
    expect(component.service.hasChanges()).toBe(false);

    component.selectAll();
    expect(component.service.hasChanges()).toBe(true);
  });
});
