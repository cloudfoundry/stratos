import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
  entityCatalog,
  EntityServiceFactory,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers,
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TailwindDialogService } from '../../../shared/services/tailwind-dialog.service';
import { ApiKeysPageComponent } from './api-keys-page.component';

describe('ApiKeysPageComponent', () => {
  let component: ApiKeysPageComponent;
  let fixture: ComponentFixture<ApiKeysPageComponent>;

  const mockDialogService = {
    open: vi.fn()
  };

  beforeEach(async () => {
    // Clear and register entities BEFORE TestBed configuration for Angular 20
    (entityCatalog as any).clear();
    const entities = generateStratosEntities();
    entities.forEach(entity => entityCatalog.register(entity));

    // Create initial state with stratosApiKey sections to prevent store errors
    const initialState = {
      pagination: {
        stratosApiKey: {}
      },
      request: {
        stratosApiKey: {}
      },
      requestData: {
        stratosApiKey: {}
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(initialState as any),
        ApiKeysPageComponent,
      ],
      providers: [
        EntityServiceFactory,
        {
          provide: TailwindDialogService,
          useValue: mockDialogService,
        },
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiKeysPageComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges here - the component constructor accesses the store
    // which can cause issues during test setup
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
