import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Signal, provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../kubernetes.testing.module';
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
  const podStub = { podsInCluster: (_g: string) => signal([]) as Signal<unknown[]>, refresh: podRefresh };
  const nodeStub = { nodesInCluster: (_g: string) => signal([]) as Signal<unknown[]>, refresh: nodeRefresh };
  const namespaceStub = { namespacesForEndpoint: (_g: string) => signal([]) as Signal<unknown[]>, refresh: namespaceRefresh };

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

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesSummaryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('primes the cluster data services on init instead of dispatching pagination actions', () => {
    // ngOnInit ran in the second beforeEach via detectChanges.
    expect(podRefresh).toHaveBeenCalled();
    expect(nodeRefresh).toHaveBeenCalled();
    expect(namespaceRefresh).toHaveBeenCalled();
  });
});
