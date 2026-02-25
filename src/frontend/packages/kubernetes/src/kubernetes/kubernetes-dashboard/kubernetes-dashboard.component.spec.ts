import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import {
  entityCatalog,
  TestEntityCatalog,
  generateStratosEntities,
  EntityCatalogProvidersModule,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { kubeEntityCatalog } from '../kubernetes-entity-generator';
import { KubernetesDashboardTabComponent } from './kubernetes-dashboard.component';

describe('KubernetesDashboardTabComponent', () => {
  let component: KubernetesDashboardTabComponent;
  let fixture: ComponentFixture<KubernetesDashboardTabComponent>;
  let originalFetch: typeof fetch;

  beforeEach(async () => {
    // Manually register catalog entities before TestBed setup
    const testEntityCatalog = entityCatalog as TestEntityCatalog;
    testEntityCatalog.clear();
    const entities = [
      ...generateStratosEntities(),
      ...kubeEntityCatalog.allKubeEntities(),
    ];
    entities.forEach(entity => entityCatalog.register(entity));

    // Mock fetch to prevent iframe from making network requests
    // The component creates an iframe with src="/pp/v1/kubedash/{guid}/login"
    // In test environment, this would trigger fetch requests that fail
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      json: async () => ({}),
      text: async () => '',
      blob: async () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      clone: function() { return this; },
      body: null,
      bodyUsed: false,
      type: 'basic' as ResponseType,
      url: '',
      redirected: false,
    } as Response);

    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogProvidersModule,
        KubernetesDashboardTabComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                endpointId: 'test-endpoint-guid'
              },
              queryParams: {}
            }
          }
        },
        TabNavService,
        HttpClient,
        HttpHandler,
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesDashboardTabComponent);
    component = fixture.componentInstance;
    // Don't trigger change detection to prevent iframe from attempting to load
    // The iframe would trigger fetch requests that we don't want in tests
    // fixture.detectChanges();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;

    // Clean up any pending timers from checkPageLoad setTimeout
    vi.clearAllTimers();

    // Destroy fixture to clean up DOM and subscriptions
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct endpoint guid', () => {
    expect(component.kubeEndpointService.baseKube.guid).toBe('test-endpoint-guid');
  });

  it('should set loading state initially', () => {
    expect(component['isLoadingSignal']()).toBe(true);
  });

  it('should not have error state initially', () => {
    expect(component['hasErrorSignal']()).toBe(false);
  });
});
