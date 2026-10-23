import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';
import { KubeEndpointEviction } from '../endpoint-data/kube-endpoint-eviction';
import { KubeNamespaceDataService } from './kube-namespace-data.service';

const KUBE_GUID = 'kube-1';
const NS_URL = '/pp/v1/proxy/api/v1/namespaces?limit=500';

describe('KubeNamespaceDataService', () => {
  let svc: KubeNamespaceDataService;
  let registry: KubeEndpointDataRegistry;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        KubeEndpointDataRegistry,
        KubeNamespaceDataService,
      ],
    });
    registry = TestBed.inject(KubeEndpointDataRegistry);
    svc = TestBed.inject(KubeNamespaceDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('namespacesForEndpoint exposes a signal projecting the endpoint cache', () => {
    const sig = svc.namespacesForEndpoint(KUBE_GUID);
    expect(sig()).toEqual([]);
  });

  it('refresh delegates to the endpoint service which fires the namespaces request', async () => {
    const refreshPromise = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne(NS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'default' } }] },
    });
    await refreshPromise;

    const ns = registry.getService(KUBE_GUID).namespaces();
    expect(ns).toHaveLength(1);
    expect(ns[0].metadata.name).toBe('default');
    expect(ns[0].kubeGuid).toBe(KUBE_GUID);
  });

  it('namespacesForEndpoint signal updates after refresh', async () => {
    const sig = svc.namespacesForEndpoint(KUBE_GUID);
    const refreshPromise = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne(NS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'kube-system' } }, { metadata: { name: 'default' } }] },
    });
    await refreshPromise;
    expect(sig()).toHaveLength(2);
  });

  it('namespaceByName projects the single namespace matching the name', async () => {
    const refreshPromise = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne(NS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'kube-system' } }, { metadata: { name: 'default' } }] },
    });
    await refreshPromise;

    expect(svc.namespaceByName(KUBE_GUID, 'default')()?.metadata.name).toBe('default');
    expect(svc.namespaceByName(KUBE_GUID, 'nope')()).toBeUndefined();
  });

  it('allNamespacesAcrossEndpoints aggregates per-endpoint signals', async () => {
    const aggregate = svc.allNamespacesAcrossEndpoints(['kube-1', 'kube-2']);
    expect(aggregate()).toEqual([]);

    const r1 = svc.refresh({ kubeGuid: 'kube-1' });
    httpMock.expectOne(NS_URL).flush({ 'kube-1': { items: [{ metadata: { name: 'a' } }] } });
    await r1;

    const r2 = svc.refresh({ kubeGuid: 'kube-2' });
    httpMock.expectOne(NS_URL).flush({ 'kube-2': { items: [{ metadata: { name: 'b' } }] } });
    await r2;

    expect(aggregate()).toHaveLength(2);
  });

  it('create POSTs a new namespace then refreshes the cache', async () => {
    const creating = svc.create(KUBE_GUID, 'new-ns');

    const post = httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ metadata: { name: 'new-ns' } });
    expect(post.request.headers.get('x-cap-cnsi-list')).toBe(KUBE_GUID);
    post.flush({});

    // The POST resolves a microtask before create() calls refresh(), which
    // dispatches the list GET — let those microtasks settle first.
    await Promise.resolve();
    await Promise.resolve();
    httpMock.expectOne(NS_URL).flush({ [KUBE_GUID]: { items: [{ metadata: { name: 'new-ns' } }] } });
    await creating;
  });

  it('create rejects on an error status', async () => {
    const creating = svc.create(KUBE_GUID, 'dup');
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces')
      .flush({ message: 'already exists' }, { status: 409, statusText: 'Conflict' });

    await expect(creating).rejects.toBeDefined();
  });

  it('fetchDirect collects errors when the request fails', async () => {
    const direct = svc.fetchDirect(KUBE_GUID);
    httpMock.expectOne(NS_URL).flush({ message: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    const result = await direct;

    expect(result).toEqual([]);
    const errs = svc.errors()();
    expect(errs.length).toBeGreaterThan(0);
    expect(errs[0].code).toBe('UNAUTHORIZED');
  });

  it('fetchDirect returns items on a happy path', async () => {
    const direct = svc.fetchDirect(KUBE_GUID);
    httpMock.expectOne(NS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'default' } }] },
    });
    const result = await direct;
    expect(result).toHaveLength(1);
    expect(result[0].kubeGuid).toBe(KUBE_GUID);
  });

  it('keeps the newest 50 errors and drops the oldest', async () => {
    for (let i = 0; i <= 50; i++) {
      const direct = svc.fetchDirect(`kube-${i}`);
      httpMock.expectOne(NS_URL).flush('boom', { status: 500, statusText: 'Server Error' });
      await direct;
    }
    const errs = svc.errors()();
    expect(errs).toHaveLength(50);
    expect(errs[0].affected?.[0]).toBe('kube-1');
    expect(errs[49].affected?.[0]).toBe('kube-50');
  });
  // A page keeps the projection it got at first render. After the endpoint
  // leaves and comes back, the registry vends a new per-endpoint service;
  // the held projection must follow it, not the orphaned one.
  it('a held projection follows the endpoint service across unregister and reconnect', async () => {
    const held = svc.namespacesForEndpoint(KUBE_GUID);
    expect(held()).toEqual([]);

    // The departure as KubeEndpointRegistryHook performs it, then the reconnect.
    registry.unregister(KUBE_GUID);
    TestBed.inject(KubeEndpointEviction).evict(KUBE_GUID);
    const loading = registry.getService(KUBE_GUID).refresh('namespaces');
    httpMock.expectOne(NS_URL).flush({ [KUBE_GUID]: { items: [{ metadata: { name: 'after' } }] } });
    await loading;

    expect(held().map(ns => ns.metadata.name)).toEqual(['after']);
  });

  // The proxy answers 200 with a per-endpoint error entry for a failed call.
  it('fetchDirect records a per-endpoint proxy error with its reason', async () => {
    const fetching = svc.fetchDirect(KUBE_GUID);
    httpMock.expectOne(NS_URL).flush({ [KUBE_GUID]: { error: { statusCode: 500, status: 'Error proxing request' }, errorResponse: 'dial tcp: i/o timeout' } });
    await expect(fetching).resolves.toEqual([]);
    expect(svc.errors()()).toEqual([expect.objectContaining({
      detail: 'Error proxing request: dial tcp: i/o timeout',
    })]);
  });

  it('create rejects a namespace the endpoint refused', async () => {
    const creating = svc.create(KUBE_GUID, 'new-ns');
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces').flush({ [KUBE_GUID]: { error: { statusCode: 403, status: '403 Forbidden' }, errorResponse: { kind: 'Status', message: 'denied' } } });
    await expect(creating).rejects.toThrow('403 Forbidden: denied');
  });
});
