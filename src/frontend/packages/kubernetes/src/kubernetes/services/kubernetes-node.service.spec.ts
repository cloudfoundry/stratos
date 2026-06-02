import { Signal, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MetricsDataService } from '../../../../store/src/services/metrics-data.service';
import { KubeNodeDataService } from '../../services/domain-data/kube-node-data.service';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';
import { KubernetesNodeService } from './kubernetes-node.service';

describe('KubernetesNodeService', () => {
  const refresh = vi.fn().mockResolvedValue(undefined);
  const nodeSig = signal<{ metadata: { name: string }; status?: unknown } | undefined>(undefined);
  const nodeDataStub = {
    refresh,
    nodeByName: (_g: string, _n: string) => nodeSig as Signal<unknown>,
  };

  let svc: KubernetesNodeService;

  beforeEach(() => {
    vi.clearAllMocks();
    nodeSig.set({ metadata: { name: 'node-a' }, status: { conditions: [] } });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: KubeNodeDataService, useValue: nodeDataStub },
        { provide: MetricsDataService, useValue: {} },
        { provide: KubernetesEndpointService, useValue: { kubeGuid: 'k1' } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { nodeName: 'node-a' } } } },
        KubernetesNodeService,
      ],
    });
    svc = TestBed.inject(KubernetesNodeService);
  });

  it('refreshes the cluster node cache for its endpoint', () => {
    expect(refresh).toHaveBeenCalledWith('k1');
  });

  it('projects the node by name onto nodeEntity$', async () => {
    const node = await firstValueFrom(svc.nodeEntity$);
    expect(node.metadata.name).toBe('node-a');
  });
});
