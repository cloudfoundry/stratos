import { provideHttpClient } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  EndpointsDataService,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityCatalogTestModuleManualStore,
  EntityServiceFactory,
  generateStratosEntities,
  TEST_CATALOGUE_ENTITIES
} from '@stratosui/store';
import { createBasicStoreModule, testSCFEndpoint, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { signal } from '@angular/core';
import { CurrentUserPermissionsService } from '../../../../core/permissions/current-user-permissions.service';
import { TabNavService } from '../../../../tab-nav.service';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { BackupEndpointsComponent } from './backup-endpoints.component';

describe('BackupEndpointsComponent', () => {
  let component: BackupEndpointsComponent;
  let fixture: ComponentFixture<BackupEndpointsComponent>;

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
        EntityServiceFactory,
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
        provideZonelessChangeDetection(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });

    // Set up entity catalog helper from DI
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    // Wave 5 (W36-B): seed EndpointsDataService.endpointsList signal with
    // a test endpoint so the component's
    // `toObservable(endpointsData.endpointsList).pipe(take(1))` chain
    // emits and the constructor doesn't EmptyError.
    const endpointsData = TestBed.inject(EndpointsDataService);
    const endpointsListSignal = signal([testSCFEndpoint]);
    Object.defineProperty(endpointsData, 'endpointsList', { value: endpointsListSignal });
    Object.defineProperty(endpointsData, 'loading', { value: signal(false) });
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
});
