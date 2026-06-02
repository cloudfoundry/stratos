import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Signal, provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubePodDataService } from '../../services/domain-data/kube-pod-data.service';
import { KubeNodeDataService } from '../../services/domain-data/kube-node-data.service';
import { KubeNamespaceDataService } from '../../services/domain-data/kube-namespace-data.service';
import { KubernetesHomeCardComponent } from './kubernetes-home-card.component';

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

  const podStub = { podsInCluster: (_g: string) => pods as Signal<unknown[]>, refresh: podRefresh };
  const nodeStub = { nodesInCluster: (_g: string) => nodes as Signal<unknown[]>, refresh: nodeRefresh };
  const namespaceStub = { namespacesForEndpoint: (_g: string) => namespaces as Signal<unknown[]>, refresh: namespaceRefresh };

  beforeEach(async () => {
    pods.set([]);
    nodes.set([]);
    namespaces.set([]);
    vi.clearAllMocks();
    await TestBed.configureTestingModule({imports: [...KubernetesBaseTestModules,
        KubernetesHomeCardComponent,
      ],
      providers: [
        EntityServiceFactory,
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

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesHomeCardComponent);
    component = fixture.componentInstance;
    component.endpoint = {} as EndpointModel;
    fixture.detectChanges();
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
});
