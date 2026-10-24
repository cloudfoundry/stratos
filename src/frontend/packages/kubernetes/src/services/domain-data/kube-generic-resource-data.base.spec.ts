import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { inject, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { KubeEndpointEviction } from '../endpoint-data/kube-endpoint-eviction';
import { KubeGenericResourceConfig, KubeGenericResourceDataServiceBase } from './kube-generic-resource-data.base';

class TestResourceService extends KubeGenericResourceDataServiceBase<{ metadata: { name: string } }> {
  protected readonly http = {} as HttpClient;
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/api/v1', resourceName: 'tests', namespaced: true, title: 'tests',
  };
}

class DeletableTestService extends KubeGenericResourceDataServiceBase<{ metadata: { name: string; namespace?: string } }> {
  public lastDelete?: { url: string; cnsi: string | null };
  protected readonly http = {
    delete: (url: string, opts: any) => {
      this.lastDelete = { url, cnsi: opts?.headers?.get?.('x-cap-cnsi-list') ?? null };
      return of(null);
    },
  } as unknown as HttpClient;
  protected config: KubeGenericResourceConfig = {
    apiPath: '/api/v1', resourceName: 'secrets', namespaced: true, title: 'secrets',
  };
}

// The base registers with the root eviction bus, so build in DI context.
const build = <S>(ctor: new () => S): S => TestBed.runInInjectionContext(() => new ctor());

describe('KubeGenericResourceDataServiceBase workload scope', () => {
  it('setWorkloadItems stores items readable via itemsInWorkload, keyed by release', () => {
    const svc = build(TestResourceService);
    expect(svc.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')()).toEqual([]);
    svc.setWorkloadItems('cnsi-1', 'ns-a', 'rel-x', [{ metadata: { name: 'r1' } } as any]);
    const out = svc.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')();
    expect(out.length).toBe(1);
    expect(out[0].kubeGuid).toBe('cnsi-1');
    expect((out[0].metadata as any).kubeId).toBe('cnsi-1');
    expect(svc.itemsInWorkload('cnsi-1', 'ns-a', 'rel-y')()).toEqual([]);
  });
});

describe('KubeGenericResourceDataServiceBase delete', () => {
  it('DELETEs the namespaced resource URL with the cnsi header and drops the row from workload scope', async () => {
    const svc = build(DeletableTestService);
    svc.setWorkloadItems('cnsi-1', 'ns-a', 'rel-x', [
      { metadata: { name: 'r1', namespace: 'ns-a' } } as any,
      { metadata: { name: 'r2', namespace: 'ns-a' } } as any,
    ]);

    await svc.delete('cnsi-1', 'r1', 'ns-a');

    expect(svc.lastDelete?.url).toBe('/pp/v1/proxy/api/v1/namespaces/ns-a/secrets/r1');
    expect(svc.lastDelete?.cnsi).toBe('cnsi-1');
    expect(svc.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')().map(i => i.metadata.name)).toEqual(['r2']);
  });

  it('drops the deleted row from cluster and namespace scopes too', async () => {
    const svc = build(DeletableTestService);
    (svc as any)['_clusterItems'].set(new Map([['cnsi-1', [{ metadata: { name: 'r1' }, kubeGuid: 'cnsi-1' }]]]));
    svc.setWorkloadItems('cnsi-1', 'ns-a', 'rel-x', [{ metadata: { name: 'r1', namespace: 'ns-a' } } as any]);
    await svc.delete('cnsi-1', 'r1', 'ns-a');
    expect(svc.itemsInCluster('cnsi-1')()).toEqual([]);
    expect(svc.itemsInWorkload('cnsi-1', 'ns-a', 'rel-x')()).toEqual([]);
  });

  it('uses the cluster URL form when no namespace is given', async () => {
    const svc = build(DeletableTestService);
    (svc as any).config = { apiPath: '/api/v1', resourceName: 'persistentvolumes', namespaced: false, title: 'pv' };
    await svc.delete('cnsi-1', 'pv1');
    expect(svc.lastDelete?.url).toBe('/pp/v1/proxy/api/v1/persistentvolumes/pv1');
  });
});

class HttpTestService extends KubeGenericResourceDataServiceBase<{ metadata: { name: string } }> {
  protected readonly http = inject(HttpClient);
  protected readonly config: KubeGenericResourceConfig = {
    apiPath: '/api/v1', resourceName: 'tests', namespaced: true, title: 'tests',
  };
}

// A response already on the wire when its endpoint departs carries the
// old credentials' data; it must not land after the eviction.
describe('KubeGenericResourceDataServiceBase eviction while a load is in flight', () => {
  const A = 'kube-a';
  const B = 'kube-b';
  const CLUSTER_URL = '/pp/v1/proxy/api/v1/tests?limit=500';
  const NS_URL = '/pp/v1/proxy/api/v1/namespaces/ns/tests?limit=500';
  let httpMock: HttpTestingController;
  let svc: HttpTestService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    svc = build(HttpTestService);
  });

  afterEach(() => httpMock.verify());

  const pending = (url: string, guid: string) =>
    httpMock.expectOne(r => r.url === url && r.headers.get('x-cap-cnsi-list') === guid);
  const listOf = (guid: string) => ({ [guid]: { items: [{ metadata: { name: 'x' } }] } });

  it('drops the departed endpoint\'s late cluster and namespace lists and keeps the other\'s', async () => {
    const loads = [A, B].flatMap(g => [svc.refresh({ kubeGuid: g }), svc.refresh({ kubeGuid: g, namespace: 'ns' })]);
    const reqs = [A, B].flatMap(g => [pending(CLUSTER_URL, g), pending(NS_URL, g)]);

    TestBed.inject(KubeEndpointEviction).evict(A);
    reqs.forEach(r => r.flush(listOf(r.request.headers.get('x-cap-cnsi-list') as string)));
    await Promise.all(loads);

    expect(svc.itemsInCluster(A)()).toEqual([]);
    expect(svc.itemsInNamespace(A, 'ns')()).toEqual([]);
    expect(svc.itemsInCluster(B)()).toHaveLength(1);
    expect(svc.itemsInNamespace(B, 'ns')()).toHaveLength(1);
  });

  it('drops the departed endpoint\'s late failure', async () => {
    const load = svc.refresh({ kubeGuid: A });
    const req = pending(CLUSTER_URL, A);

    TestBed.inject(KubeEndpointEviction).evict(A);
    req.flush('boom', { status: 500, statusText: 'Server Error' });
    await load;

    expect(svc.errors()()).toEqual([]);
  });
});

// The backend proxy answers 200 with one entry per endpoint; a failed
// upstream call is an { error, errorResponse } entry, not a list.
describe('KubeGenericResourceDataServiceBase proxy per-endpoint errors', () => {
  const A = 'kube-a';
  const CLUSTER_URL = '/pp/v1/proxy/api/v1/tests?limit=500';
  let httpMock: HttpTestingController;
  let svc: HttpTestService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    svc = build(HttpTestService);
  });

  afterEach(() => httpMock.verify());

  const unreachable = {
    [A]: {
      error: { statusCode: 500, status: 'Error proxying request' },
      errorResponse: 'dial tcp 10.0.0.1:6443: connect: connection refused',
    },
  };

  it('records the endpoint\'s reason instead of reading the error as an empty list', async () => {
    const load = svc.refresh({ kubeGuid: A });
    httpMock.expectOne(CLUSTER_URL).flush(unreachable);
    await load;

    expect(svc.itemsInCluster(A)()).toEqual([]);
    expect(svc.errors()()).toEqual([expect.objectContaining({
      code: 'FETCH_ERROR',
      detail: 'Error proxying request: dial tcp 10.0.0.1:6443: connect: connection refused',
      affected: [A, 'cluster:kube-a'],
    })]);
  });

  it('marks an upstream 401 as unauthorized', async () => {
    const load = svc.refresh({ kubeGuid: A });
    httpMock.expectOne(CLUSTER_URL).flush({
      [A]: {
        error: { statusCode: 401, status: '401 Unauthorized' },
        errorResponse: { kind: 'Status', status: 'Failure', message: 'Unauthorized', code: 401 },
      },
    });
    await load;

    expect(svc.errors()()).toEqual([expect.objectContaining({ code: 'UNAUTHORIZED', detail: '401 Unauthorized' })]);
  });

  it('clears the endpoint\'s errors when a later load succeeds', async () => {
    const failed = svc.refresh({ kubeGuid: A });
    httpMock.expectOne(CLUSTER_URL).flush(unreachable);
    await failed;
    expect(svc.errors()()).toHaveLength(1);

    const retried = svc.refresh({ kubeGuid: A });
    httpMock.expectOne(CLUSTER_URL).flush({ [A]: { items: [] } });
    await retried;

    expect(svc.errors()()).toEqual([]);
  });

  it('rejects a delete the endpoint refused and keeps the row', async () => {
    (svc as any)['_clusterItems'].set(new Map([[A, [{ metadata: { name: 'r1' }, kubeGuid: A }]]]));
    const del = svc.delete(A, 'r1');
    httpMock.expectOne('/pp/v1/proxy/api/v1/tests/r1').flush({
      [A]: {
        error: { statusCode: 403, status: '403 Forbidden' },
        errorResponse: { kind: 'Status', message: 'tests "r1" is forbidden: User "u" cannot delete resource "tests"' },
      },
    });

    await expect(del).rejects.toThrow('403 Forbidden: tests "r1" is forbidden: User "u" cannot delete resource "tests"');
    expect(svc.itemsInCluster(A)()).toHaveLength(1);
  });
});
