import { Injector, signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { KubeEndpointDataRegistry } from '../../services/endpoint-data/kube-endpoint-data.registry';
import { KubePodDataService } from '../../services/domain-data/kube-pod-data.service';
import { KubeServiceDataService } from '../../services/domain-data/kube-service-data.service';
import { buildPodsSignalConfig, buildServicesSignalConfig } from './kubernetes-resource-signal-configs';

describe('kubernetes-resource-signal-configs — workload mode', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeEndpointDataRegistry,
        KubePodDataService,
        KubeServiceDataService,
      ],
    });
  });

  it('pod factory in workload mode reads podsInWorkload and omits onRefresh', () => {
    const pod = TestBed.inject(KubePodDataService);
    pod.setWorkloadPods('cnsi-1', 'ns-a', 'rel-x', [{ metadata: { name: 'p1' } } as any]);
    const injector = TestBed.inject(Injector);
    const ctx = {
      kubeGuid: 'cnsi-1',
      selectedNamespace: signal(undefined).asReadonly(),
      isWorkloadView: true,
      workloadNamespace: 'ns-a',
      workloadTitle: 'rel-x',
    };
    const cfg = buildPodsSignalConfig(ctx as any, injector);
    expect(cfg.totalFilteredResults()).toBe(1);
    expect(cfg.onRefresh).toBeUndefined();
  });

  it('pod factory in non-workload mode still has onRefresh defined', () => {
    const injector = TestBed.inject(Injector);
    const ctx = {
      kubeGuid: 'cnsi-1',
      selectedNamespace: signal(undefined).asReadonly(),
      isWorkloadView: false,
    };
    const cfg = buildPodsSignalConfig(ctx as any, injector);
    expect(cfg.onRefresh).toBeDefined();
  });

  it('service factory in workload mode reads servicesInWorkload and omits onRefresh', () => {
    const svc = TestBed.inject(KubeServiceDataService);
    svc.setWorkloadServices('cnsi-1', 'ns-a', 'rel-x', [{ metadata: { name: 's1' } } as any]);
    const injector = TestBed.inject(Injector);
    const ctx = {
      kubeGuid: 'cnsi-1',
      selectedNamespace: signal(undefined).asReadonly(),
      isWorkloadView: true,
      workloadNamespace: 'ns-a',
      workloadTitle: 'rel-x',
    };
    const cfg = buildServicesSignalConfig(ctx as any, injector);
    expect(cfg.totalFilteredResults()).toBe(1);
    expect(cfg.onRefresh).toBeUndefined();
  });

  it('service factory in non-workload mode still has onRefresh defined', () => {
    const injector = TestBed.inject(Injector);
    const ctx = {
      kubeGuid: 'cnsi-1',
      selectedNamespace: signal(undefined).asReadonly(),
      isWorkloadView: false,
    };
    const cfg = buildServicesSignalConfig(ctx as any, injector);
    expect(cfg.onRefresh).toBeDefined();
  });
});
