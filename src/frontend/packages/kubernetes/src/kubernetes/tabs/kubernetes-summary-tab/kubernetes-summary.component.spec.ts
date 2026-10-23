import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Signal, provideZonelessChangeDetection, signal } from '@angular/core';
import { StratosError } from '../../../services/endpoint-data/kube-types';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { seedEndpointsDataService } from '@stratosui/store/testing';

import { KubeBaseGuidMock, KubernetesBaseTestModules, kubeTestEndpoint } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubePodDataService } from '../../../services/domain-data/kube-pod-data.service';
import { KubeNodeDataService } from '../../../services/domain-data/kube-node-data.service';
import { KubeNamespaceDataService } from '../../../services/domain-data/kube-namespace-data.service';
import { KubernetesSummaryTabComponent } from './kubernetes-summary.component';

describe('KubernetesSummaryTabComponent', () => {
  let component: KubernetesSummaryTabComponent;
  let fixture: ComponentFixture<KubernetesSummaryTabComponent>;

  const podRefresh = vi.fn().mockResolvedValue(undefined);
  const nodeRefresh = vi.fn().mockResolvedValue(undefined);
  const namespaceRefresh = vi.fn().mockResolvedValue(undefined);
  const nodeErrors = signal<StratosError[]>([]);
  const podStub = {
    podsInCluster: (_g: string) => signal([]) as Signal<unknown[]>, refresh: podRefresh, scopeErrors: () => [],
  };
  const nodeStub = {
    nodesInCluster: (_g: string) => signal([]) as Signal<unknown[]>, refresh: nodeRefresh,
    errors: () => nodeErrors.asReadonly(),
  };
  const namespaceStub = {
    namespacesForEndpoint: (_g: string) => signal([]) as Signal<unknown[]>, refresh: namespaceRefresh,
    namespaceListErrors: () => [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({imports: [...KubernetesBaseTestModules,
        KubernetesSummaryTabComponent,
      ],
      providers: [
        KubernetesEndpointService,
        KubeBaseGuidMock,
        HttpClient,
        HttpHandler,
        TabNavService,
        { provide: KubePodDataService, useValue: podStub },
        { provide: KubeNodeDataService, useValue: nodeStub },
        { provide: KubeNamespaceDataService, useValue: namespaceStub },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    nodeErrors.set([]);
    seedEndpointsDataService([kubeTestEndpoint]);
    fixture = TestBed.createComponent(KubernetesSummaryTabComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('primes the cluster data services on init instead of dispatching pagination actions', () => {
    // ngOnInit ran in the second beforeEach's first render.
    expect(podRefresh).toHaveBeenCalled();
    expect(nodeRefresh).toHaveBeenCalled();
    expect(namespaceRefresh).toHaveBeenCalled();
  });

  it('shows a failed node load as "-" with its reason instead of 0 nodes', async () => {
    nodeErrors.set([{ code: 'UNAUTHORIZED', title: 'kube-nodes', detail: '401 Unauthorized', affected: ['anything'] }]);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-test="cluster-load-failure"]')?.textContent).toContain('401 Unauthorized');
    const nodesTile = el.querySelector('app-card-number-metric');
    expect(nodesTile?.textContent).toContain('-');
    expect(nodesTile?.textContent).not.toContain('0');
  });
});
