import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { KubeEndpointDataRegistry } from '../../../services/endpoint-data/kube-endpoint-data.registry';
import { KubePodDataService } from '../../../services/domain-data/kube-pod-data.service';
import { KubernetesNodePodsSignalConfigService } from './kubernetes-node-pods-signal-config.service';

const KUBE_GUID = 'kube-1';
const NODE = 'node-1';
const NODE_PODS_URL = `/pp/v1/proxy/api/v1/pods?limit=500&fieldSelector=${encodeURIComponent('spec.nodeName=' + NODE)}`;

describe('KubernetesNodePodsSignalConfigService', () => {
  let svc: KubernetesNodePodsSignalConfigService;
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
        KubernetesNodePodsSignalConfigService,
      ],
    });
    svc = TestBed.inject(KubernetesNodePodsSignalConfigService);
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

  it('initialize wires up the node-scoped view', () => {
    svc.initialize(KUBE_GUID, NODE);
    httpMock.expectOne(NODE_PODS_URL).flush({ [KUBE_GUID]: { items: [] } });
    expect(svc.view).toBeDefined();
    expect(svc.view.pagedItems()).toEqual([]);
  });

  it('populates pods from the node fetch', async () => {
    svc.initialize(KUBE_GUID, NODE);
    httpMock.expectOne(NODE_PODS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'p1' } }, { metadata: { name: 'p2' } }] },
    });
    await Promise.resolve();
    expect(svc.pods()).toHaveLength(2);
  });

  it('refresh re-fetches the node-scoped cache', async () => {
    svc.initialize(KUBE_GUID, NODE);
    httpMock.expectOne(NODE_PODS_URL).flush({ [KUBE_GUID]: { items: [] } });
    await Promise.resolve();
    const refreshing = svc.refresh();
    httpMock.expectOne(NODE_PODS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'p' } }] },
    });
    await refreshing;
    expect(svc.pods()).toHaveLength(1);
  });

  it('clearFilters resets nameFilter, sort, pageIndex', () => {
    svc.initialize(KUBE_GUID, NODE);
    httpMock.expectOne(NODE_PODS_URL).flush({ [KUBE_GUID]: { items: [] } });
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'name', direction: 'desc' });
    svc.pageIndex.set(2);
    svc.clearFilters();
    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().direction).toBe('asc');
    expect(svc.pageIndex()).toBe(0);
  });
});
