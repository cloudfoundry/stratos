import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';
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
});
