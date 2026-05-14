import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { KubeEndpointDataRegistry } from '../../../services/endpoint-data/kube-endpoint-data.registry';
import { KubePodDataService } from '../../../services/domain-data/kube-pod-data.service';
import { KubernetesPodsSignalConfigService } from './kubernetes-pods-signal-config.service';

const KUBE_GUID = 'kube-1';
const CLUSTER_PODS_URL = '/pp/v1/proxy/api/v1/pods?limit=500';

describe('KubernetesPodsSignalConfigService', () => {
  let svc: KubernetesPodsSignalConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeEndpointDataRegistry,
        KubePodDataService,
        KubernetesPodsSignalConfigService,
      ],
    });
    svc = TestBed.inject(KubernetesPodsSignalConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes filter, sort, pageSize, pageIndex, nameFilter, viewMode signals', () => {
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.nameFilter).toBeDefined();
    expect(svc.viewMode).toBeDefined();
  });

  it('initialize wires up the view pipeline', () => {
    svc.initialize(KUBE_GUID);
    httpMock.expectOne(CLUSTER_PODS_URL).flush({ [KUBE_GUID]: { items: [] } });
    expect(svc.view).toBeDefined();
    expect(svc.view.pagedItems()).toEqual([]);
    expect(svc.view.totalFilteredResults()).toBe(0);
  });

  it('populates pods after the cluster fetch resolves', async () => {
    svc.initialize(KUBE_GUID);
    httpMock.expectOne(CLUSTER_PODS_URL).flush({
      [KUBE_GUID]: {
        items: [
          { metadata: { name: 'a', namespace: 'default' } },
          { metadata: { name: 'b', namespace: 'kube-system' } },
        ],
      },
    });
    await Promise.resolve();
    expect(svc.pods()).toHaveLength(2);
    expect(svc.view.pagedItems()).toHaveLength(2);
  });

  it('filters pods by nameFilter', async () => {
    svc.initialize(KUBE_GUID);
    httpMock.expectOne(CLUSTER_PODS_URL).flush({
      [KUBE_GUID]: {
        items: [
          { metadata: { name: 'foo' } },
          { metadata: { name: 'bar' } },
        ],
      },
    });
    await Promise.resolve();
    svc.nameFilter.set('foo');
    TestBed.tick();
    expect(svc.view.pagedItems()).toHaveLength(1);
    expect(svc.view.pagedItems()[0].metadata.name).toBe('foo');
  });

  it('clearFilters resets nameFilter, sort, pageIndex', () => {
    svc.initialize(KUBE_GUID);
    httpMock.expectOne(CLUSTER_PODS_URL).flush({ [KUBE_GUID]: { items: [] } });
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'name', direction: 'desc' });
    svc.pageIndex.set(2);
    svc.clearFilters();
    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().direction).toBe('asc');
    expect(svc.pageIndex()).toBe(0);
  });

  it('refresh re-fetches cluster pods', async () => {
    svc.initialize(KUBE_GUID);
    httpMock.expectOne(CLUSTER_PODS_URL).flush({ [KUBE_GUID]: { items: [] } });
    await Promise.resolve();
    const refreshing = svc.refresh();
    httpMock.expectOne(CLUSTER_PODS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'new-pod' } }] },
    });
    await refreshing;
    expect(svc.pods()).toHaveLength(1);
    expect(svc.pods()[0].metadata.name).toBe('new-pod');
  });
});
