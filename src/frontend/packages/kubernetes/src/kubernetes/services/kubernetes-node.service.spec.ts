import { Signal, computed, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MetricsDataService } from '../../../../store/src/services/metrics-data.service';
import { KubeNodeDataService } from '../../services/domain-data/kube-node-data.service';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';
import { MetricStatistic } from '../store/kube.types';
import { KubeNodeMetric, KubernetesNodeService } from './kubernetes-node.service';

describe('KubernetesNodeService', () => {
  const refresh = vi.fn().mockResolvedValue(undefined);
  const nodeSig = signal<{ metadata: { name: string }; status?: unknown } | undefined>(undefined);
  const nodeDataStub = {
    refresh,
    nodeByName: (_g: string, _n: string) => nodeSig as Signal<unknown>,
  };

  // observe() stub: counts how often something still watches its metrics.
  const metricsSrc = signal<unknown>(null);
  let metricsReads = 0;
  const stop = vi.fn();
  const metricsDataStub = {
    observe: vi.fn(() => ({
      metrics: computed(() => { metricsReads++; return metricsSrc(); }),
      stop,
    })),
  };

  let svc: KubernetesNodeService;

  beforeEach(() => {
    vi.clearAllMocks();
    metricsSrc.set(null);
    metricsReads = 0;
    nodeSig.set({ metadata: { name: 'node-a' }, status: { conditions: [] } });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: KubeNodeDataService, useValue: nodeDataStub },
        { provide: MetricsDataService, useValue: metricsDataStub },
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

  it('ends the metric observation and its watch when the caller lets go', () => {
    const { entity$, pollerSub } = svc.setupMetricObservable(KubeNodeMetric.CPU, MetricStatistic.MAXIMUM);
    const values: number[] = [];
    const sub = entity$.subscribe(v => values.push(v));
    metricsSrc.set({ data: { result: [{ value: [0, '7'] }] } });
    TestBed.tick();
    expect(values).toEqual([7]);

    // What the stats card does on destroy (async pipe + pollerSub).
    sub.unsubscribe();
    pollerSub.unsubscribe();
    expect(stop).toHaveBeenCalledTimes(1);

    const reads = metricsReads;
    metricsSrc.set({ data: { result: [{ value: [0, '9'] }] } });
    TestBed.tick();
    expect(metricsReads).toBe(reads);
  });
});
