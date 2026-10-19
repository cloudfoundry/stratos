import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';
import { KubeEndpointEviction } from '../endpoint-data/kube-endpoint-eviction';
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

  it('nodeByName projects the single node matching the name', async () => {
    const refreshing = svc.refresh(KUBE_GUID);
    httpMock.expectOne(NODES_URL).flush({
      [KUBE_GUID]: { items: [
        { metadata: { name: 'node-a' } },
        { metadata: { name: 'node-b' } },
      ] },
    });
    await refreshing;

    expect(svc.nodeByName(KUBE_GUID, 'node-b')()?.metadata.name).toBe('node-b');
    expect(svc.nodeByName(KUBE_GUID, 'missing')()).toBeUndefined();
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

  it('keeps the newest 50 errors and drops the oldest', async () => {
    for (let i = 0; i <= 50; i++) {
      const refreshing = svc.refresh(`kube-${i}`);
      httpMock.expectOne(NODES_URL).flush('boom', { status: 500, statusText: 'Server Error' });
      await refreshing;
    }
    const errs = svc.errors()();
    expect(errs).toHaveLength(50);
    expect(errs[0].affected?.[0]).toBe('kube-1');
    expect(errs[49].affected?.[0]).toBe('kube-50');
  });
  // A response already on the wire when its endpoint departs carries the
  // old credentials' data; it must not land after the eviction.
  describe('eviction while a load is in flight', () => {
    const OTHER = 'kube-2';
    const pending = (guid: string) =>
      httpMock.expectOne(r => r.url === NODES_URL && r.headers.get('x-cap-cnsi-list') === guid);

    it('drops the departed endpoint\'s late response and keeps the other\'s', async () => {
      const a = svc.refresh(KUBE_GUID);
      const b = svc.refresh(OTHER);
      const reqA = pending(KUBE_GUID);
      const reqB = pending(OTHER);

      TestBed.inject(KubeEndpointEviction).evict(KUBE_GUID);
      reqA.flush({ [KUBE_GUID]: { items: [{ metadata: { name: 'a' } }] } });
      reqB.flush({ [OTHER]: { items: [{ metadata: { name: 'b' } }] } });
      await Promise.all([a, b]);

      expect(svc.nodesInCluster(KUBE_GUID)()).toEqual([]);
      expect(svc.nodesInCluster(OTHER)()).toHaveLength(1);
      // The node-count sync must not rebuild a registry entry for it either.
      const guids = TestBed.inject(KubeEndpointDataRegistry).getSnapshot().instances.map(i => i.kubeGuid);
      expect(guids).not.toContain(KUBE_GUID);
    });

    it('drops the departed endpoint\'s late failure', async () => {
      const a = svc.refresh(KUBE_GUID);
      const reqA = pending(KUBE_GUID);

      TestBed.inject(KubeEndpointEviction).evict(KUBE_GUID);
      reqA.flush('boom', { status: 500, statusText: 'Server Error' });
      await a;

      expect(svc.errors()()).toEqual([]);
    });
  });
});
