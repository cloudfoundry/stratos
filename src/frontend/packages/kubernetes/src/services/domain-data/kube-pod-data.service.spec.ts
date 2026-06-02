import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';
import { KubePodDataService } from './kube-pod-data.service';

const KUBE_GUID = 'kube-1';
const CLUSTER_PODS_URL = '/pp/v1/proxy/api/v1/pods?limit=500';
const NS_PODS_URL = (ns: string) => `/pp/v1/proxy/api/v1/namespaces/${ns}/pods?limit=500`;
const NODE_PODS_URL = (node: string) =>
  `/pp/v1/proxy/api/v1/pods?limit=500&fieldSelector=${encodeURIComponent('spec.nodeName=' + node)}`;

describe('KubePodDataService', () => {
  let svc: KubePodDataService;
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
      ],
    });
    svc = TestBed.inject(KubePodDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('podsInCluster fires a cluster-wide GET and populates the signal', async () => {
    const pods = svc.podsInCluster(KUBE_GUID);
    expect(pods()).toEqual([]);

    httpMock.expectOne(CLUSTER_PODS_URL).flush({
      [KUBE_GUID]: {
        items: [
          { metadata: { name: 'a' }, status: { phase: 'Running' } },
          { metadata: { name: 'b' }, status: { phase: 'Pending' } },
        ],
      },
    });

    // Allow microtasks (signal update propagation) to flush.
    await Promise.resolve();
    expect(pods()).toHaveLength(2);
    expect(pods()[0].kubeGuid).toBe(KUBE_GUID);
    expect(pods()[0].metadata.kubeId).toBe(KUBE_GUID);
  });

  it('podsInNamespace targets the namespaced URL', async () => {
    const pods = svc.podsInNamespace(KUBE_GUID, 'kube-system');
    httpMock.expectOne(NS_PODS_URL('kube-system')).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'coredns' } }] },
    });
    await Promise.resolve();
    expect(pods()).toHaveLength(1);
    expect(pods()[0].metadata.name).toBe('coredns');
  });

  it('podsOnNode passes the fieldSelector', async () => {
    const pods = svc.podsOnNode(KUBE_GUID, 'node-1');
    httpMock.expectOne(NODE_PODS_URL('node-1')).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'p1' } }, { metadata: { name: 'p2' } }] },
    });
    await Promise.resolve();
    expect(pods()).toHaveLength(2);
  });

  it('podByName finds a pod by name within a namespace scope', async () => {
    const pod = svc.podByName(KUBE_GUID, 'coredns', 'kube-system');
    httpMock.expectOne(NS_PODS_URL('kube-system')).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'coredns' }, status: { phase: 'Running' } }] },
    });
    await Promise.resolve();

    expect(pod()?.metadata.name).toBe('coredns');
    expect(svc.podByName(KUBE_GUID, 'missing', 'kube-system')()).toBeUndefined();
  });

  it('expandedStatus surfaces a waiting reason ahead of phase', async () => {
    const pods = svc.podsInCluster(KUBE_GUID);
    httpMock.expectOne(CLUSTER_PODS_URL).flush({
      [KUBE_GUID]: {
        items: [{
          metadata: { name: 'crash' },
          status: {
            phase: 'Pending',
            containerStatuses: [{
              name: 'app',
              restartCount: 7,
              state: { waiting: { reason: 'CrashLoopBackOff' } },
            }],
          },
        }],
      },
    });
    await Promise.resolve();
    expect(pods()[0].expandedStatus?.status).toBe('CrashLoopBackOff');
    expect(pods()[0].expandedStatus?.restarts).toBe(7);
  });

  it('refresh forces a re-fetch on the cluster scope', async () => {
    const pods = svc.podsInCluster(KUBE_GUID);
    httpMock.expectOne(CLUSTER_PODS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'a' } }] },
    });
    await Promise.resolve();
    expect(pods()).toHaveLength(1);

    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID });
    httpMock.expectOne(CLUSTER_PODS_URL).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'a' } }, { metadata: { name: 'b' } }] },
    });
    await refreshing;
    expect(pods()).toHaveLength(2);
  });

  it('refresh with namespace targets the namespaced cache', async () => {
    const pods = svc.podsInNamespace(KUBE_GUID, 'default');
    httpMock.expectOne(NS_PODS_URL('default')).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'a' } }] },
    });
    await Promise.resolve();

    const refreshing = svc.refresh({ kubeGuid: KUBE_GUID, namespace: 'default' });
    httpMock.expectOne(NS_PODS_URL('default')).flush({
      [KUBE_GUID]: { items: [{ metadata: { name: 'a' } }, { metadata: { name: 'b' } }] },
    });
    await refreshing;
    expect(pods()).toHaveLength(2);
  });

  it('marks a 403 as a tristate error and leaves items empty', async () => {
    const pods = svc.podsInCluster(KUBE_GUID);
    httpMock.expectOne(CLUSTER_PODS_URL).flush(
      { message: 'forbidden' },
      { status: 403, statusText: 'Forbidden' },
    );
    await Promise.resolve();
    expect(pods()).toEqual([]);
    const errs = svc.errors()();
    expect(errs.length).toBeGreaterThan(0);
    expect(errs[0].code).toBe('UNAUTHORIZED');
  });

  it('dedupes concurrent reads on the same scope', async () => {
    // Two reads on the same cluster scope back-to-back should produce
    // exactly one HTTP request (the second is satisfied by shareReplay
    // in-flight dedup).
    const a = svc.podsInCluster(KUBE_GUID);
    const b = svc.podsInCluster(KUBE_GUID);
    void a;
    void b;
    httpMock.expectOne(CLUSTER_PODS_URL).flush({ [KUBE_GUID]: { items: [] } });
    await Promise.resolve();
    expect(a()).toEqual([]);
    expect(b()).toEqual([]);
  });

  describe('workload scope', () => {
    it('setWorkloadPods stores normalized pods readable via podsInWorkload', () => {
      const sig = svc.podsInWorkload('cnsi-1', 'ns-a', 'rel-x');
      expect(sig()).toEqual([]);

      svc.setWorkloadPods('cnsi-1', 'ns-a', 'rel-x', [
        { metadata: { name: 'p1' }, status: { phase: 'Running' } } as any,
      ]);

      const pods = svc.podsInWorkload('cnsi-1', 'ns-a', 'rel-x')();
      expect(pods.length).toBe(1);
      expect(pods[0].kubeGuid).toBe('cnsi-1');
      expect(pods[0].metadata.kubeId).toBe('cnsi-1');
      expect(pods[0].expandedStatus.status).toBe('Running'); // normalizePod ran
    });

    it('keys workload pods by kubeGuid:namespace:release (no cross-release leak)', () => {
      svc.setWorkloadPods('cnsi-1', 'ns-a', 'rel-x', [{ metadata: { name: 'p1' } } as any]);
      expect(svc.podsInWorkload('cnsi-1', 'ns-a', 'rel-y')()).toEqual([]);
    });
  });
});
