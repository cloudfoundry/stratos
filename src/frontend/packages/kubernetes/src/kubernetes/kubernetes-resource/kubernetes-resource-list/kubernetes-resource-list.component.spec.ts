import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute, Router } from '@angular/router';

import { TabNavService, SignalListConfig } from '@stratosui/core';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import {
  entityCatalog,
  TestEntityCatalog,
  generateStratosEntities,
  EntityCatalogProvidersModule,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesResourceListComponent } from './kubernetes-resource-list.component';
import { KubernetesSignalConfigRegistry } from '../kubernetes-signal-config-registry';
import { KubePodDataService } from '../../../services/domain-data/kube-pod-data.service';
import { KubeNamespaceDataService } from '../../../services/domain-data/kube-namespace-data.service';
import { kubernetesNodesEntityType } from '../../kubernetes-entity-factory';

// Minimal SignalListConfig stub — only the fields the shell reads after
// construction (signalListConfig() truthiness check).
function makeMinimalSignalConfig(): SignalListConfig<unknown> {
  return {
    pagedItems: signal([]),
    totalFilteredResults: signal(0),
    totalPages: signal(0),
    pageIndex: signal(0),
    pageSize: signal(10),
    isAnyLoading: signal(false),
    errorsByCnsi: signal(new Map()),
    columns: [],
    getRowKey: (row: unknown) => String(row),
  };
}

// Workload route: data.isWorkload=true, entityCatalogKey='pod',
// parent.parent.params.guid encodes endpointId:namespace:releaseTitle.
const WORKLOAD_GUID = 'cnsi-1:ns-a:rel-x';
const workloadRoute = {
  snapshot: {
    data: {
      isWorkload: true,
      entityCatalogKey: 'pod',
    },
    params: {},
    queryParams: {},
    parent: {
      parent: {
        params: { guid: WORKLOAD_GUID },
      },
    },
  },
};

describe('KubernetesResourceListComponent', () => {
  let component: KubernetesResourceListComponent;
  let fixture: ComponentFixture<KubernetesResourceListComponent>;

  // Stub the cluster namespace data service the component reads for its
  // namespace dropdown so the test doesn't depend on live HTTP.
  const namespacesSig = signal<Array<{ metadata: { name: string } }>>([]);
  const namespaceRefresh = vi.fn().mockResolvedValue(undefined);
  const namespaceStub = {
    namespacesForEndpoint: (_g: string) => namespacesSig,
    refresh: namespaceRefresh,
  };

  beforeEach(async () => {
    namespacesSig.set([]);
    namespaceRefresh.mockClear();
    // Manually register catalog entities before TestBed setup
    const testEntityCatalog = entityCatalog as TestEntityCatalog;
    testEntityCatalog.clear();
    const entities = [
      ...generateStratosEntities(),
      ...kubeEntityCatalog.allKubeEntities(),
    ];
    entities.forEach(entity => entityCatalog.register(entity));

    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogProvidersModule,
        KubernetesResourceListComponent
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: KubeNamespaceDataService, useValue: namespaceStub },
        {
          provide: BaseKubeGuid,
          useValue: { guid: 'test-guid' }
        },
        TabNavService,
        {
          provide: Router,
          useValue: {
            url: '/kubernetes/test-guid/pods',
            navigate: vi.fn().mockResolvedValue(true),
          }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                entityCatalogKey: 'pod'
              },
              params: {
              },
              queryParams: {}
            }
          }
        },
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    // Register a 'pod' factory so the signal-config gate is truthy and
    // the constructor does not fall through to the redirect branch.
    const registry = TestBed.inject(KubernetesSignalConfigRegistry);
    registry.register('pod', () => makeMinimalSignalConfig());
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesResourceListComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges to avoid triggering subscriptions
    // and async operations that aren't needed for basic component tests
    // fixture.detectChanges();
  });

  afterEach(() => {
    // Destroy fixture to clean up DOM and subscriptions
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sources the namespace dropdown from KubeNamespaceDataService (namespaced view)', () => {
    namespacesSig.set([{ metadata: { name: 'alpha' } }, { metadata: { name: 'beta' } }]);

    fixture.detectChanges(); // runs ngOnInit — namespaced (non-workload) path

    expect(namespaceRefresh).toHaveBeenCalledWith({ kubeGuid: 'test-guid' });
    let emitted: string[] | undefined;
    // strict: this is the namespaced (non-workload) path; ngOnInit (run by the
    // detectChanges above) always assigns namespaces$ here.
    component.namespaces$!.subscribe(v => emitted = v);
    expect(emitted).toEqual(['alpha', 'beta']);
  });

  // -------------------------------------------------------------------------
  // Workload path tests
  // -------------------------------------------------------------------------
  describe('workload view (isWorkload=true)', () => {
    let workloadFixture: ComponentFixture<KubernetesResourceListComponent>;

    beforeEach(async () => {
      TestBed.resetTestingModule();

      // Re-register catalog entities after reset
      const testEntityCatalog = entityCatalog as TestEntityCatalog;
      testEntityCatalog.clear();
      const entities = [
        ...generateStratosEntities(),
        ...kubeEntityCatalog.allKubeEntities(),
      ];
      entities.forEach(entity => entityCatalog.register(entity));

      await TestBed.configureTestingModule({
        imports: [
          createBasicStoreModule(),
          EntityCatalogProvidersModule,
          KubernetesResourceListComponent,
        ],
        providers: [
          ...STORE_TEST_PROVIDERS,
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: BaseKubeGuid,
            // BaseKubeGuid is not used in workload mode (kubeId comes from
            // the helm-release guid), but must be present to satisfy DI.
            useValue: { guid: 'unused-for-workload' },
          },
          TabNavService,
          {
            provide: Router,
            useValue: { url: '/kubernetes/cnsi-1/workloads/cnsi-1:ns-a:rel-x/pods' },
          },
          {
            provide: ActivatedRoute,
            useValue: workloadRoute,
          },
          provideZonelessChangeDetection(),
          provideNoopAnimations(),
        ],
      }).compileComponents();

      // Initialize EntityCatalogHelper for Angular 20 compatibility
      const helper = TestBed.inject(EntityCatalogHelper);
      EntityCatalogHelpers.SetEntityCatalogHelper(helper);

      // Register a 'pod' factory so the signal-config gate is truthy.
      const registry = TestBed.inject(KubernetesSignalConfigRegistry);
      registry.register('pod', () => makeMinimalSignalConfig());
    });

    afterEach(() => {
      if (workloadFixture) {
        workloadFixture.destroy();
      }
    });

    it('builds a signal config for the workload view (gate removed)', () => {
      workloadFixture = TestBed.createComponent(KubernetesResourceListComponent);
      // Constructor runs synchronously; detectChanges is not required for
      // the signal assignment check but triggers no harm.
      expect(workloadFixture.componentInstance.signalListConfig()).toBeDefined();
    });

    it('warmRegistryCache does not fire REST kicks in workload mode', () => {
      const pod = TestBed.inject(KubePodDataService);
      const spy = vi.spyOn(pod, 'refresh');
      workloadFixture = TestBed.createComponent(KubernetesResourceListComponent);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Signal-only rendering — no legacy app-list-view
  // -------------------------------------------------------------------------
  describe('signal-only rendering', () => {
    let signalFixture: ComponentFixture<KubernetesResourceListComponent>;

    beforeEach(async () => {
      TestBed.resetTestingModule();

      const testEntityCatalog = entityCatalog as TestEntityCatalog;
      testEntityCatalog.clear();
      const entities = [
        ...generateStratosEntities(),
        ...kubeEntityCatalog.allKubeEntities(),
      ];
      entities.forEach(entity => entityCatalog.register(entity));

      await TestBed.configureTestingModule({
        imports: [
          createBasicStoreModule(),
          EntityCatalogProvidersModule,
          KubernetesResourceListComponent,
        ],
        providers: [
          ...STORE_TEST_PROVIDERS,
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: BaseKubeGuid,
            useValue: { guid: 'test-guid' },
          },
          TabNavService,
          {
            provide: Router,
            useValue: {
              url: '/kubernetes/test-guid/pods',
              navigate: vi.fn().mockResolvedValue(true),
            },
          },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                data: { entityCatalogKey: 'pod' },
                params: {},
                queryParams: {},
              },
            },
          },
          provideZonelessChangeDetection(),
          provideNoopAnimations(),
        ],
      }).compileComponents();

      const helper = TestBed.inject(EntityCatalogHelper);
      EntityCatalogHelpers.SetEntityCatalogHelper(helper);

      // Register a 'pod' factory so the signal-config gate is truthy.
      const registry = TestBed.inject(KubernetesSignalConfigRegistry);
      registry.register('pod', () => makeMinimalSignalConfig());
    });

    afterEach(() => {
      if (signalFixture) {
        signalFixture.destroy();
      }
    });

    it('renders only app-signal-list — no app-list-view in the template', () => {
      signalFixture = TestBed.createComponent(KubernetesResourceListComponent);
      signalFixture.detectChanges();
      expect(signalFixture.componentInstance.signalListConfig()).toBeDefined();
      expect(signalFixture.nativeElement.querySelector('app-list-view')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Unregistered entity key → redirect to cluster summary
  // -------------------------------------------------------------------------
  describe('unregistered entity key redirect', () => {
    let unregFixture: ComponentFixture<KubernetesResourceListComponent>;
    let navigateSpy: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      TestBed.resetTestingModule();

      const testEntityCatalog = entityCatalog as TestEntityCatalog;
      testEntityCatalog.clear();
      const entities = [
        ...generateStratosEntities(),
        ...kubeEntityCatalog.allKubeEntities(),
      ];
      entities.forEach(entity => entityCatalog.register(entity));

      navigateSpy = vi.fn().mockResolvedValue(true);

      await TestBed.configureTestingModule({
        imports: [
          createBasicStoreModule(),
          EntityCatalogProvidersModule,
          KubernetesResourceListComponent,
        ],
        providers: [
          ...STORE_TEST_PROVIDERS,
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: BaseKubeGuid,
            useValue: { guid: 'test-guid' },
          },
          TabNavService,
          {
            provide: Router,
            useValue: {
              url: '/kubernetes/test-guid/node',
              navigate: navigateSpy,
            },
          },
          {
            provide: ActivatedRoute,
            // Use 'node' (kubernetesNodesEntityType) — it exists in the catalog
            // but has no signal factory registered, so the fallback branch fires.
            useValue: {
              snapshot: {
                data: { entityCatalogKey: kubernetesNodesEntityType },
                params: {},
                queryParams: {},
              },
            },
          },
          provideZonelessChangeDetection(),
          provideNoopAnimations(),
        ],
      }).compileComponents();

      const helper = TestBed.inject(EntityCatalogHelper);
      EntityCatalogHelpers.SetEntityCatalogHelper(helper);

      // Intentionally do NOT register a 'node' factory — this exercises the
      // no-signal-factory branch we are about to replace with a redirect.
    });

    afterEach(() => {
      if (unregFixture) {
        unregFixture.destroy();
      }
    });

    it('redirects to cluster summary for an unregistered entity key (no ngrx provider built)', () => {
      unregFixture = TestBed.createComponent(KubernetesResourceListComponent);
      unregFixture.detectChanges();
      expect(unregFixture.componentInstance.signalListConfig()).toBeUndefined();
      expect((unregFixture.componentInstance as any).provider).toBeUndefined();
      expect(navigateSpy).toHaveBeenCalledWith(['/kubernetes', 'test-guid']);
    });
  });
});
