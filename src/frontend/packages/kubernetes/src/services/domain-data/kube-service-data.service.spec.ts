import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';
import { KubeEndpointEviction } from '../endpoint-data/kube-endpoint-eviction';
import { KubeServiceDataService } from './kube-service-data.service';

const KUBE_GUID = 'kube-1';
const SERVICES_URL = '/pp/v1/proxy/api/v1/services?limit=500';
const ENDPOINTS_URL = '/pp/v1/proxy/api/v1/endpoints?limit=500';
const NS_SERVICES_URL = '/pp/v1/proxy/api/v1/namespaces/default/services?limit=500';

describe('KubeServiceDataService', () => {
  let svc: KubeServiceDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeEndpointDataRegistry,
        KubeServiceDataService,
      ],
    });
    svc = TestBed.inject(KubeServiceDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('servicesInCluster + endpointsInCluster default to empty', () => {
    expect(svc.servicesInCluster(KUBE_GUID)()).toEqual([]);
    expect(svc.endpointsInCluster(KUBE_GUID)()).toEqual([]);
  });

  it('refresh without namespace fetches both services and endpoints', async () => {
    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne(SERVICES_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'svc-a' } }, { metadata: { name: 'svc-b' } }] },
    });
    httpMock.expectOne(ENDPOINTS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'ep-a' } }] },
    });
    await refreshing;

    const services = svc.servicesInCluster(KUBE_GUID)();
    const endpoints = svc.endpointsInCluster(KUBE_GUID)();
    expect(services).toHaveLength(2);
    expect(services[0].kubeGuid).toBe(KUBE_GUID);
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].metadata.kubeId).toBe(KUBE_GUID);
  });

  it('refresh with namespace fetches only namespaced services', async () => {
    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID, namespace: 'default' });
    httpMock.expectOne(NS_SERVICES_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'in-default' } }] },
    });
    await refreshing;

    expect(svc.servicesInNamespace(KUBE_GUID, 'default')()).toHaveLength(1);
    // Cluster cache untouched
    expect(svc.servicesInCluster(KUBE_GUID)()).toEqual([]);
  });

  it('records UNAUTHORIZED on 403 service fetch', async () => {
    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne(SERVICES_URL).flush({ message: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    httpMock.expectOne(ENDPOINTS_URL).flush({ [KUBE_GUID]: { items: [] } });
    await refreshing;

    const errs = svc.errors()();
    expect(errs.some(e => e.code === 'UNAUTHORIZED' && e.title === 'kube-services')).toBe(true);
  });

  it('keeps the newest 50 errors and drops the oldest', async () => {
    for (let i = 0; i <= 50; i++) {
      const refreshing = svc.refresh({ kubeGuid: `kube-${i}`, namespace: 'default' });
      httpMock.expectOne(NS_SERVICES_URL).flush('boom', { status: 500, statusText: 'Server Error' });
      await refreshing;
    }
    const errs = svc.errors()();
    expect(errs).toHaveLength(50);
    expect(errs[0].affected?.[0]).toBe('kube-1');
    expect(errs[49].affected?.[0]).toBe('kube-50');
  });

  it('keeps namespace caches isolated across (kubeGuid, namespace) tuples', async () => {
    const r1 = svc.refresh({ kubeGuid: 'kube-1', namespace: 'default' });
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces/default/services?limit=500').flush({
      'kube-1': { items: [{ metadata: { name: 'a' } }] },
    });
    await r1;

    const r2 = svc.refresh({ kubeGuid: 'kube-1', namespace: 'kube-system' });
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces/kube-system/services?limit=500').flush({
      'kube-1': { items: [{ metadata: { name: 'x' } }, { metadata: { name: 'y' } }] },
    });
    await r2;

    expect(svc.servicesInNamespace('kube-1', 'default')()).toHaveLength(1);
    expect(svc.servicesInNamespace('kube-1', 'kube-system')()).toHaveLength(2);
  });

  describe('workload scope', () => {
    it('setWorkloadServices stores services readable via servicesInWorkload, keyed by release', () => {
      const svc = TestBed.inject(KubeServiceDataService);
      expect(svc.servicesInWorkload('cnsi-1', 'ns-a', 'rel-x')()).toEqual([]);
      svc.setWorkloadServices('cnsi-1', 'ns-a', 'rel-x', [{ metadata: { name: 's1' } } as any]);
      const out = svc.servicesInWorkload('cnsi-1', 'ns-a', 'rel-x')();
      expect(out.length).toBe(1);
      expect(out[0].kubeGuid).toBe('cnsi-1');
      expect(out[0].metadata.kubeId).toBe('cnsi-1');
      expect(svc.servicesInWorkload('cnsi-1', 'ns-a', 'rel-y')()).toEqual([]);
    });
  });

  describe('delete', () => {
    it('DELETEs the namespaced service and drops it from cached scopes', async () => {
      svc.setWorkloadServices('cnsi-1', 'ns-a', 'rel-x', [
        { metadata: { name: 's1' } } as any,
        { metadata: { name: 's2' } } as any,
      ]);
      const done = svc.delete('cnsi-1', 's1', 'ns-a');
      const req = httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces/ns-a/services/s1');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('x-cap-cnsi-list')).toBe('cnsi-1');
      req.flush(null);
      await done;
      expect(svc.servicesInWorkload('cnsi-1', 'ns-a', 'rel-x')().map(s => s.metadata.name)).toEqual(['s2']);
    });
  });
  // A response already on the wire when its endpoint departs carries the
  // old credentials' data; it must not land after the eviction.
  describe('eviction while a load is in flight', () => {
    const OTHER = 'kube-2';
    const pending = (url: string, guid: string) =>
      httpMock.expectOne(r => r.url === url && r.headers.get('x-cap-cnsi-list') === guid);
    const listOf = (guid: string) => ({ [guid]: { items: [{ metadata: { name: 'x' } }] } });

    it('drops the departed endpoint\'s late cluster lists and keeps the other\'s', async () => {
      const a = svc.refresh({ kubeGuid: KUBE_GUID });
      const b = svc.refresh({ kubeGuid: OTHER });
      const reqs = [KUBE_GUID, OTHER].flatMap(g => [pending(SERVICES_URL, g), pending(ENDPOINTS_URL, g)]);

      TestBed.inject(KubeEndpointEviction).evict(KUBE_GUID);
      reqs.forEach(r => r.flush(listOf(r.request.headers.get('x-cap-cnsi-list') as string)));
      await Promise.all([a, b]);

      expect(svc.servicesInCluster(KUBE_GUID)()).toEqual([]);
      expect(svc.endpointsInCluster(KUBE_GUID)()).toEqual([]);
      expect(svc.servicesInCluster(OTHER)()).toHaveLength(1);
      expect(svc.endpointsInCluster(OTHER)()).toHaveLength(1);
    });

    it('drops the departed endpoint\'s late namespaced list and failure', async () => {
      const ok = svc.refresh({ kubeGuid: KUBE_GUID, namespace: 'default' });
      const okReq = pending(NS_SERVICES_URL, KUBE_GUID);
      const failing = svc.refresh({ kubeGuid: KUBE_GUID, namespace: 'other' });
      const failReq = pending('/pp/v1/proxy/api/v1/namespaces/other/services?limit=500', KUBE_GUID);

      TestBed.inject(KubeEndpointEviction).evict(KUBE_GUID);
      okReq.flush(listOf(KUBE_GUID));
      failReq.flush('boom', { status: 500, statusText: 'Server Error' });
      await Promise.all([ok, failing]);

      expect(svc.servicesInNamespace(KUBE_GUID, 'default')()).toEqual([]);
      expect(svc.errors()()).toEqual([]);
    });
  });
});
