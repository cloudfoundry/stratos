import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { EndpointModel } from '@stratosui/store';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes/kubernetes-entity-factory';
import { HelmReleaseDataService } from '../../kubernetes/workloads/release/helm-release-data.service';
import { HelmReleaseGraph } from '../../kubernetes/workloads/workload.types';
import { KubeAnalysisDataService } from '../domain-data/kube-analysis-data.service';
import { KubeSecretDataService } from '../domain-data/kube-generic-resource-data.services';
import { KubeNodeDataService } from '../domain-data/kube-node-data.service';
import { KubePodDataService } from '../domain-data/kube-pod-data.service';
import { KubeServiceDataService } from '../domain-data/kube-service-data.service';
import { KubeEndpointDataRegistry } from './kube-endpoint-data.registry';
import { KubeEndpointRegistryHook } from './kube-endpoint-registry.hook';
import { KubeHelmDataService } from './kube-helm-data.service';
import { HelmRelease, KubeNode, KubePod, KubeSecret, KubeService } from './kube-types';

type EndpointMap = { [guid: string]: EndpointModel };

function kubeEp(guid: string, status: 'connected' | 'disconnected' | 'connecting' = 'connected'): EndpointModel {
  return {
    guid,
    name: guid,
    cnsi_type: KUBERNETES_ENDPOINT_TYPE,
    connectionStatus: status,
  } as unknown as EndpointModel;
}

function cfEp(guid: string, status: 'connected' | 'disconnected' = 'connected'): EndpointModel {
  return {
    guid,
    name: guid,
    cnsi_type: 'cf',
    connectionStatus: status,
  } as unknown as EndpointModel;
}

describe('KubeEndpointRegistryHook', () => {
  let endpoints$: BehaviorSubject<EndpointMap>;
  let registry: KubeEndpointDataRegistry;

  function init(initial: EndpointMap = {}) {
    endpoints$ = new BehaviorSubject<EndpointMap>(initial);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EndpointsService, useValue: { endpoints$ } },
        KubeEndpointDataRegistry,
        KubeEndpointRegistryHook,
      ],
    });
    registry = TestBed.inject(KubeEndpointDataRegistry);
    // Force eager construction so the subscription is live.
    TestBed.inject(KubeEndpointRegistryHook);
  }

  beforeEach(() => {
    // No-op; each test calls init() with its initial state.
  });

  it('warms registry for kubernetes endpoints already connected at subscription time', () => {
    init({ 'kube-a': kubeEp('kube-a') });

    const snap = registry.getSnapshot();
    expect(snap.instances).toHaveLength(1);
    expect(snap.instances[0].kubeGuid).toBe('kube-a');
  });

  it('warms registry on a new connect emission', () => {
    init({});
    expect(registry.getSnapshot().instances).toHaveLength(0);

    endpoints$.next({ 'kube-a': kubeEp('kube-a') });

    const snap = registry.getSnapshot();
    expect(snap.instances).toHaveLength(1);
    expect(snap.instances[0].kubeGuid).toBe('kube-a');
  });

  it('evicts registry entry when connectionStatus flips to disconnected', () => {
    init({ 'kube-a': kubeEp('kube-a') });
    expect(registry.getSnapshot().instances).toHaveLength(1);

    endpoints$.next({ 'kube-a': kubeEp('kube-a', 'disconnected') });

    expect(registry.getSnapshot().instances).toHaveLength(0);
  });

  it('evicts registry entry when endpoint is removed entirely', () => {
    init({ 'kube-a': kubeEp('kube-a') });
    expect(registry.getSnapshot().instances).toHaveLength(1);

    endpoints$.next({});

    expect(registry.getSnapshot().instances).toHaveLength(0);
  });

  it('ignores non-kubernetes endpoints', () => {
    init({ 'cf-a': cfEp('cf-a') });
    expect(registry.getSnapshot().instances).toHaveLength(0);

    endpoints$.next({ 'cf-a': cfEp('cf-a'), 'cf-b': cfEp('cf-b') });
    expect(registry.getSnapshot().instances).toHaveLength(0);
  });

  it('is idempotent on duplicate emissions with the same connected set', () => {
    init({ 'kube-a': kubeEp('kube-a') });
    const before = registry.getSnapshot();
    expect(before.instances).toHaveLength(1);
    const newInstancesBefore = before.newInstances;

    // Re-emit the same map shape — no new instance should be created and
    // no eviction should occur.
    endpoints$.next({ 'kube-a': kubeEp('kube-a') });

    const after = registry.getSnapshot();
    expect(after.instances).toHaveLength(1);
    expect(after.newInstances).toBe(newInstancesBefore);
    expect(after.unregisters).toBe(before.unregisters);
  });

  it('handles mixed kubernetes + non-kubernetes endpoint maps correctly', () => {
    init({
      'kube-a': kubeEp('kube-a'),
      'cf-a': cfEp('cf-a'),
      'kube-b': kubeEp('kube-b', 'disconnected'),
    });

    const snap = registry.getSnapshot();
    expect(snap.instances).toHaveLength(1);
    expect(snap.instances[0].kubeGuid).toBe('kube-a');

    // Connect kube-b, disconnect kube-a — net swap.
    endpoints$.next({
      'kube-a': kubeEp('kube-a', 'disconnected'),
      'cf-a': cfEp('cf-a'),
      'kube-b': kubeEp('kube-b'),
    });

    const after = registry.getSnapshot();
    const guids = after.instances.map(i => i.kubeGuid).sort();
    expect(guids).toEqual(['kube-b']);
  });
});

// A departed endpoint's data was fetched with credentials the user no
// longer holds, so every root domain cache must drop it. Each test seeds
// endpoints A and B, disconnects A, and checks A is gone and B is intact.
describe('KubeEndpointRegistryHook domain cache eviction', () => {
  const A = 'kube-a';
  const B = 'kube-b';
  let endpoints$: BehaviorSubject<EndpointMap>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    endpoints$ = new BehaviorSubject<EndpointMap>({ [A]: kubeEp(A), [B]: kubeEp(B) });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EndpointsService, useValue: { endpoints$ } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(KubeEndpointRegistryHook);
  });

  const disconnectA = () => endpoints$.next({ [A]: kubeEp(A, 'disconnected'), [B]: kubeEp(B) });

  // Answer the pending list request for `guid` on `path` with one item.
  function flushList(path: string, guid: string, item: unknown): void {
    const reqs = httpMock.match(r => r.url.startsWith(path) && r.headers.get('x-cap-cnsi-list') === guid);
    expect(reqs).toHaveLength(1);
    reqs[0].flush({ [guid]: { items: [item] } });
  }

  it('drops pod scopes (cluster and workload) for the departed endpoint only', () => {
    const pods = TestBed.inject(KubePodDataService);
    const pod = (name: string) => ({ metadata: { name }, status: {} }) as unknown as KubePod;
    const clusterA = pods.podsInCluster(A);
    const clusterB = pods.podsInCluster(B);
    flushList('/pp/v1/proxy/api/v1/pods', A, pod('pa'));
    flushList('/pp/v1/proxy/api/v1/pods', B, pod('pb'));
    pods.setWorkloadPods(A, 'ns', 'rel', [pod('wa')]);
    pods.setWorkloadPods(B, 'ns', 'rel', [pod('wb')]);
    expect(clusterA()).toHaveLength(1);

    disconnectA();

    expect(clusterA()).toEqual([]);
    expect(pods.podsInWorkload(A, 'ns', 'rel')()).toEqual([]);
    expect(clusterB()).toHaveLength(1);
    expect(pods.podsInWorkload(B, 'ns', 'rel')()).toHaveLength(1);
  });

  it('drops generic resource scopes (cluster, namespace, workload), e.g. Secrets', async () => {
    const secrets = TestBed.inject(KubeSecretDataService);
    const secret = (name: string) => ({ metadata: { name } }) as KubeSecret;
    for (const guid of [A, B]) {
      const cluster = secrets.refresh({ kubeGuid: guid });
      flushList('/pp/v1/proxy/api/v1/secrets', guid, secret(`c-${guid}`));
      await cluster;
      const ns = secrets.refresh({ kubeGuid: guid, namespace: 'ns' });
      flushList('/pp/v1/proxy/api/v1/namespaces/ns/secrets', guid, secret(`n-${guid}`));
      await ns;
      secrets.setWorkloadItems(guid, 'ns', 'rel', [secret(`w-${guid}`)]);
    }

    disconnectA();

    expect(secrets.itemsInCluster(A)()).toEqual([]);
    expect(secrets.itemsInNamespace(A, 'ns')()).toEqual([]);
    expect(secrets.itemsInWorkload(A, 'ns', 'rel')()).toEqual([]);
    expect(secrets.itemsInCluster(B)()).toHaveLength(1);
    expect(secrets.itemsInNamespace(B, 'ns')()).toHaveLength(1);
    expect(secrets.itemsInWorkload(B, 'ns', 'rel')()).toHaveLength(1);
  });

  it('drops k8s services and endpoints', async () => {
    const services = TestBed.inject(KubeServiceDataService);
    for (const guid of [A, B]) {
      const done = services.refresh({ kubeGuid: guid });
      flushList('/pp/v1/proxy/api/v1/services', guid, { metadata: { name: 's' } });
      flushList('/pp/v1/proxy/api/v1/endpoints', guid, { metadata: { name: 'e' } });
      await done;
      services.setWorkloadServices(guid, 'ns', 'rel', [{ metadata: { name: 'w' } } as KubeService]);
    }

    disconnectA();

    expect(services.servicesInCluster(A)()).toEqual([]);
    expect(services.endpointsInCluster(A)()).toEqual([]);
    expect(services.servicesInWorkload(A, 'ns', 'rel')()).toEqual([]);
    expect(services.servicesInCluster(B)()).toHaveLength(1);
    expect(services.endpointsInCluster(B)()).toHaveLength(1);
    expect(services.servicesInWorkload(B, 'ns', 'rel')()).toHaveLength(1);
  });

  it('drops cached nodes', async () => {
    const nodes = TestBed.inject(KubeNodeDataService);
    for (const guid of [A, B]) {
      const done = nodes.refresh(guid);
      flushList('/pp/v1/proxy/api/v1/nodes', guid, { metadata: { name: 'n' } } as KubeNode);
      await done;
    }

    disconnectA();

    expect(nodes.nodesInCluster(A)()).toEqual([]);
    expect(nodes.nodesInCluster(B)()).toHaveLength(1);
  });

  it('drops analysis report lists and fetched report details', async () => {
    const analysis = TestBed.inject(KubeAnalysisDataService);
    for (const guid of [A, B]) {
      const list = analysis.refresh({ kubeGuid: guid });
      httpMock.expectOne(`/pp/v1/analysis/reports/${guid}`).flush([{ id: 'r1' }]);
      await list;
      analysis.reportById(guid, 'r1').subscribe();
      httpMock.expectOne(`/pp/v1/analysis/reports/${guid}/r1`).flush({ id: 'r1' });
    }

    disconnectA();

    expect(analysis.reportsForEndpoint(A)()).toEqual([]);
    expect(analysis.reportsForEndpoint(B)()).toHaveLength(1);
    // A's detail is no longer cached, so a read goes back to the server;
    // B's detail is still served from the cache.
    analysis.reportById(A, 'r1').subscribe();
    analysis.reportById(B, 'r1').subscribe();
    httpMock.expectOne(`/pp/v1/analysis/reports/${A}/r1`);
    httpMock.expectNone(`/pp/v1/analysis/reports/${B}/r1`);
  });

  it('drops helm releases of the departed endpoint from the cross-endpoint list', async () => {
    const helm = TestBed.inject(KubeHelmDataService);
    const done = helm.loadReleases();
    httpMock.expectOne('/pp/v1/helm/releases').flush({
      [A]: [{ name: 'ra', namespace: 'ns' } as HelmRelease],
      [B]: [{ name: 'rb', namespace: 'ns' } as HelmRelease],
    });
    await done;

    disconnectA();

    expect(helm.allReleases()().map(r => r.endpointId)).toEqual([B]);
  });

  it('blanks helm release detail surfaces of the departed endpoint', () => {
    const release = TestBed.inject(HelmReleaseDataService);
    const graph = { nodes: [], links: [] } as unknown as HelmReleaseGraph;
    release.setGraph(`${A}:ns:rel`, graph);
    release.setGraph(`${B}:ns:rel`, graph);
    const graphA = release.graph(`${A}:ns:rel`);

    disconnectA();

    expect(graphA()).toBeUndefined();
    expect(release.graph(`${B}:ns:rel`)()).toBe(graph);
  });
});
