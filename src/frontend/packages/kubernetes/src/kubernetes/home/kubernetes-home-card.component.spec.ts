import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Signal, provideZonelessChangeDetection, signal } from '@angular/core';
import { StratosError } from '../../services/endpoint-data/kube-types';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubePodDataService } from '../../services/domain-data/kube-pod-data.service';
import { KubeNodeDataService } from '../../services/domain-data/kube-node-data.service';
import { KubeNamespaceDataService } from '../../services/domain-data/kube-namespace-data.service';
import { KubernetesHomeCardComponent } from './kubernetes-home-card.component';
import { By } from '@angular/platform-browser';
import { CardNumberMetricComponent } from '../../../../core/src/shared/components/cards/card-number-metric/card-number-metric.component';

describe('KubernetesHomeCardComponent', () => {
  let component: KubernetesHomeCardComponent;
  let fixture: ComponentFixture<KubernetesHomeCardComponent>;

  // Signal-backed stubs for the cluster-scoped data services the card reads.
  const pods = signal<Array<{ metadata: { name: string } }>>([]);
  const nodes = signal<Array<{ metadata: { name: string } }>>([]);
  const namespaces = signal<Array<{ metadata: { name: string } }>>([]);
  const podRefresh = vi.fn().mockResolvedValue(undefined);
  const nodeRefresh = vi.fn().mockResolvedValue(undefined);
  const namespaceRefresh = vi.fn().mockResolvedValue(undefined);

  // Load failures, as the services record them.
  const podErrors = signal<StratosError[]>([]);
  const nodeErrors = signal<StratosError[]>([]);
  const namespaceErrors = signal<StratosError[]>([]);

  const podStub = {
    podsInCluster: (_g: string) => pods as Signal<unknown[]>, refresh: podRefresh,
    scopeErrors: () => podErrors(),
  };
  const nodeStub = {
    nodesInCluster: (_g: string) => nodes as Signal<unknown[]>, refresh: nodeRefresh,
    errors: () => nodeErrors.asReadonly(),
  };
  const namespaceStub = {
    namespacesForEndpoint: (_g: string) => namespaces as Signal<unknown[]>, refresh: namespaceRefresh,
    namespaceListErrors: () => namespaceErrors(),
  };

  beforeEach(async () => {
    pods.set([]);
    nodes.set([]);
    namespaces.set([]);
    podErrors.set([]);
    nodeErrors.set([]);
    namespaceErrors.set([]);
    vi.clearAllMocks();
    await TestBed.configureTestingModule({imports: [...KubernetesBaseTestModules,
        KubernetesHomeCardComponent,
      ],
      providers: [
        KubernetesEndpointService,
        BaseKubeGuid,
        { provide: KubePodDataService, useValue: podStub },
        { provide: KubeNodeDataService, useValue: nodeStub },
        { provide: KubeNamespaceDataService, useValue: namespaceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: 'test' },
              queryParams: {}
            }
          }
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(KubernetesHomeCardComponent);
    component = fixture.componentInstance;
    component.endpoint = {} as EndpointModel;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sources node/namespace/pod counts from the signal data services on load', () => {
    pods.set([{ metadata: { name: 'p1' } }, { metadata: { name: 'p2' } }]);
    nodes.set([{ metadata: { name: 'n1' } }]);
    namespaces.set([{ metadata: { name: 'ns1' } }, { metadata: { name: 'ns2' } }, { metadata: { name: 'ns3' } }]);
    component.endpoint = { guid: 'k1' } as EndpointModel;

    component.load();

    expect(component.podCount()).toBe(2);
    expect(component.nodeCount()).toBe(1);
    expect(component.namespaceCount()).toBe(3);
  });

  it('triggers a refresh on the node and namespace services (pods auto-load)', () => {
    component.endpoint = { guid: 'k1' } as EndpointModel;

    component.load();

    expect(nodeRefresh).toHaveBeenCalledWith('k1');
    expect(namespaceRefresh).toHaveBeenCalledWith({ kubeGuid: 'k1' });
  });

  it('shows a count whose load failed as "-", with the reason, not 0', async () => {
    nodes.set([]);
    nodeErrors.set([{ code: 'FETCH_ERROR', title: 'kube-nodes', detail: 'Error proxing request: i/o timeout', affected: ['k1'] }]);
    component.endpoint = { guid: 'k1' } as EndpointModel;

    component.load();
    await fixture.whenStable();

    expect(component.nodeCount()).toBeNull();
    const el: HTMLElement = fixture.nativeElement;
    const values = [...el.querySelectorAll('.number-metric-card-value')].map(v => v.textContent!.trim());
    expect(values[0]).toBe('-');
    expect(el.querySelector('[data-test="kube-card-failure"]')?.textContent).toContain('Error proxing request: i/o timeout');
  });

  it('shows no failure while every count loaded', async () => {
    component.endpoint = { guid: 'k1' } as EndpointModel;
    component.load();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-test="kube-card-failure"]')).toBeNull();
  });

  const tiles = () => fixture.debugElement.queryAll(By.directive(CardNumberMetricComponent))
    .map(d => d.componentInstance as CardNumberMetricComponent);

  it('labels a single namespace "Namespace", not "Node"', async () => {
    namespaces.set([{ metadata: { name: 'default' } }]);
    component.endpoint = { guid: 'k1' } as EndpointModel;
    component.load();
    await fixture.whenStable();
    const namespacesTile = tiles().find(t => t.label === 'Namespaces')!;
    expect(namespacesTile.value).toBe('1');
    expect(namespacesTile.labelSingular).toBe('Namespace');
  });
});
