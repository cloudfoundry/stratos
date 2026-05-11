import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';
import { KubeNodeDataService } from './kube-node-data.service';

const KUBE_GUID = 'kube-1';
const NODES_URL = '/pp/v1/proxy/api/v1/nodes?limit=500';

describe('KubeNodeDataService', () => {
  let svc: KubeNodeDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeEndpointDataRegistry,
        KubeNodeDataService,
      ],
    });
    svc = TestBed.inject(KubeNodeDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('nodesInCluster returns an empty signal before refresh', () => {
    expect(svc.nodesInCluster(KUBE_GUID)()).toEqual([]);
  });

  it('refresh populates the per-endpoint cache and stamps kubeGuid', async () => {
    const refreshing = svc.refresh(KUBE_GUID);
    httpMock.expectOne(NODES_URL).flush({
      [KUBE_GUID]: { items: [
        { metadata: { name: 'node-a' } },
        { metadata: { name: 'node-b' } },
      ] },
    });
    await refreshing;

    const list = svc.nodesInCluster(KUBE_GUID)();
    expect(list).toHaveLength(2);
    expect(list[0].kubeGuid).toBe(KUBE_GUID);
    expect(list[0].metadata.kubeId).toBe(KUBE_GUID);
  });

  it('refresh records UNAUTHORIZED on 403', async () => {
    const refreshing = svc.refresh(KUBE_GUID);
    httpMock.expectOne(NODES_URL).flush({ message: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    await refreshing;

    expect(svc.nodesInCluster(KUBE_GUID)()).toEqual([]);
    const errs = svc.errors()();
    expect(errs.length).toBeGreaterThan(0);
    expect(errs[0].code).toBe('UNAUTHORIZED');
  });

  it('two refresh calls on different endpoints keep caches isolated', async () => {
    const r1 = svc.refresh('kube-1');
    httpMock.expectOne(NODES_URL).flush({ 'kube-1': { items: [{ metadata: { name: 'a' } }] } });
    await r1;

    const r2 = svc.refresh('kube-2');
    httpMock.expectOne(NODES_URL).flush({ 'kube-2': { items: [{ metadata: { name: 'b' } }, { metadata: { name: 'c' } }] } });
    await r2;

    expect(svc.nodesInCluster('kube-1')()).toHaveLength(1);
    expect(svc.nodesInCluster('kube-2')()).toHaveLength(2);
  });
});
