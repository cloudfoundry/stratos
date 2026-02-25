import { provideHttpClient } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityCatalogTestModuleManualStore,
  EntityServiceFactory,
  generateStratosEntities,
  stratosEntityCatalog,
  TEST_CATALOGUE_ENTITIES
} from '@stratosui/store';
import { createBasicStoreModule, testSCFEndpoint, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
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

    // Mock the getPaginationService to return a working observable with test endpoint data
    // This prevents the EmptyError that occurs when the component's constructor
    // subscribes to an empty observable with first()
    vi.spyOn(stratosEntityCatalog.endpoint.store.getAll, 'getPaginationService').mockReturnValue({
      entities$: of([testSCFEndpoint]),
      fetchingEntities$: of(false),
      pagination$: of(null),
      hasEntities$: of(true),
      totalEntities$: of(1),
      isMultiAction$: of(false)
    } as any);
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
