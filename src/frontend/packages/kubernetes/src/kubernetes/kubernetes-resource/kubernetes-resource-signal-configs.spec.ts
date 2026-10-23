import { Injector, signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { HttpTestingController } from '@angular/common/http/testing';

import { KubeEndpointDataRegistry } from '../../services/endpoint-data/kube-endpoint-data.registry';
import { KubeJobDataService } from '../../services/domain-data/kube-generic-resource-data.services';
import { KubeNamespaceDataService } from '../../services/domain-data/kube-namespace-data.service';
import { KubePodDataService } from '../../services/domain-data/kube-pod-data.service';
import { KubeServiceDataService } from '../../services/domain-data/kube-service-data.service';
import {
  buildJobsSignalConfig,
  buildNamespacesSignalConfig,
  buildPodsSignalConfig,
  buildServicesSignalConfig,
} from './kubernetes-resource-signal-configs';

describe('kubernetes-resource-signal-configs — workload mode', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeEndpointDataRegistry,
        KubeJobDataService,
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

  it('jobs factory in workload mode reads itemsInWorkload and omits onRefresh', () => {
    const jobs = TestBed.inject(KubeJobDataService);
    jobs.setWorkloadItems('cnsi-1', 'ns-a', 'rel-x', [{ metadata: { name: 'j1' } } as any]);
    const injector = TestBed.inject(Injector);
    const ctx = {
      kubeGuid: 'cnsi-1', selectedNamespace: signal(undefined).asReadonly(),
      isWorkloadView: true, workloadNamespace: 'ns-a', workloadTitle: 'rel-x',
    };
    const cfg = buildJobsSignalConfig(ctx as any, injector);
    expect(cfg.totalFilteredResults()).toBe(1);
    expect(cfg.onRefresh).toBeUndefined();
  });
});

// A failed load must give the list its failed-load state (with Retry)
// and the endpoint's reason, not an empty list.
describe('kubernetes-resource-signal-configs — load failures', () => {
  const unreachable = (guid: string) => ({
    [guid]: { error: { statusCode: 500, status: 'Error proxing request' }, errorResponse: 'dial tcp: i/o timeout' },
  });
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeEndpointDataRegistry,
        KubeJobDataService,
        KubeNamespaceDataService,
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  const ctxFor = (kubeGuid: string, isWorkloadView = false) => ({
    kubeGuid,
    selectedNamespace: signal(undefined).asReadonly(),
    isWorkloadView,
    workloadNamespace: 'ns-a',
    workloadTitle: 'rel-x',
  });

  it('generic resource list shows its endpoint\'s failure and reason, not another endpoint\'s', async () => {
    const injector = TestBed.inject(Injector);
    const cfgA = buildJobsSignalConfig(ctxFor('kube-a') as any, injector);
    const cfgB = buildJobsSignalConfig(ctxFor('kube-b') as any, injector);

    const load = TestBed.inject(KubeJobDataService).refresh({ kubeGuid: 'kube-a' });
    httpMock.expectOne('/pp/v1/proxy/apis/batch/v1/jobs?limit=500').flush(unreachable('kube-a'));
    await load;

    expect(cfgA.totalFilteredResults()).toBe(0);
    expect([...cfgA.errorsByCnsi().keys()]).toEqual(['kube-a']);
    expect(cfgA.errorDetail?.()).toBe('Error proxing request: dial tcp: i/o timeout');
    expect(cfgA.onRefresh).toBeDefined();
    expect(cfgB.errorsByCnsi().size).toBe(0);
    expect(cfgB.errorDetail?.()).toBeUndefined();
  });

  it('workload view, which has no Retry, does not show REST load failures', async () => {
    const injector = TestBed.inject(Injector);
    const cfg = buildJobsSignalConfig(ctxFor('kube-a', true) as any, injector);

    const load = TestBed.inject(KubeJobDataService).refresh({ kubeGuid: 'kube-a' });
    httpMock.expectOne('/pp/v1/proxy/apis/batch/v1/jobs?limit=500').flush(unreachable('kube-a'));
    await load;

    expect(cfg.errorsByCnsi().size).toBe(0);
  });

  it('namespaces list shows the failure of the namespace load it lists', async () => {
    const injector = TestBed.inject(Injector);
    const cfg = buildNamespacesSignalConfig(ctxFor('kube-a') as any, injector);

    const load = TestBed.inject(KubeNamespaceDataService).refresh({ kubeGuid: 'kube-a' });
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces?limit=500').flush(unreachable('kube-a'));
    await load;

    expect([...cfg.errorsByCnsi().keys()]).toEqual(['kube-a']);
    expect(cfg.errorDetail?.()).toBe('Error proxing request: dial tcp: i/o timeout');
  });
});
