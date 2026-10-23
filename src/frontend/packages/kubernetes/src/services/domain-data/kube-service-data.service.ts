import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { KUBE_LIST_DEFAULT_LIMIT, KubeListResponse } from '../endpoint-data/kube-paged-response';
import { KubeProxyResponse, kubeProxyResult } from '../endpoint-data/kube-proxy-response';
import { KubeEndpoint, KubeService, StratosError } from '../endpoint-data/kube-types';
import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';
import { KubeEndpointEviction, evictErrors, evictKeys } from '../endpoint-data/kube-endpoint-eviction';

// Per-resource domain service for k8s Services AND Endpoints. Folds the
// `kubernetes-endpoints` page's k8s Endpoints fetch in here because the
// resources are tightly related — every Service has a backing Endpoints
// object, and the legacy effect tree treated them as one slice.
//
// Cache layout: two maps keyed by either kubeGuid (cluster-scoped) or
// `${kubeGuid}/${namespace}` (namespaced) so namespace-scoped consumers
// can subscribe independently of the cluster-wide list. Cluster-wide
// fetches do NOT update the namespace map (they're separate API paths
// with different filtering semantics).

const nsKey = (kubeGuid: string, namespace: string) => `${kubeGuid}/${namespace}`;
// The list a load fills, tagged on its errors (second `affected` entry)
// so a list shows, and a good load clears, only its own failures.
const errorScopeKey = (scope: { kubeGuid: string; namespace?: string }) =>
  scope.namespace ? `ns:${scope.kubeGuid}:${scope.namespace}` : `cluster:${scope.kubeGuid}`;
const workloadKey = (kubeGuid: string, namespace: string, release: string) =>
  `${kubeGuid}/${namespace}/${release}`;

@Injectable({ providedIn: 'root' })
export class KubeServiceDataService {
  private readonly http = inject(HttpClient);
  // Declared so the registry stays a transitive dep of this service —
  // mirrors KubeNamespaceDataService and gives wave-3 a hook to attach
  // service-count to the cluster summary card without re-injecting.
  private readonly registry = inject(KubeEndpointDataRegistry);
  private readonly eviction = inject(KubeEndpointEviction);

  private readonly _clusterServices = signal<Map<string, KubeService[]>>(new Map());
  private readonly _namespaceServices = signal<Map<string, KubeService[]>>(new Map());
  private readonly _workloadServices = signal<Map<string, KubeService[]>>(new Map());
  private readonly _clusterEndpoints = signal<Map<string, KubeEndpoint[]>>(new Map());
  private readonly _errors = signal<StratosError[]>([]);

  constructor() {
    this.eviction.register(kubeGuid => {
      const owned = (key: string) => key === kubeGuid || key.startsWith(`${kubeGuid}/`);
      evictKeys(this._clusterServices, owned);
      evictKeys(this._namespaceServices, owned);
      evictKeys(this._workloadServices, owned);
      evictKeys(this._clusterEndpoints, owned);
      evictErrors(this._errors, kubeGuid, a => a === kubeGuid || a.split(':')[1] === kubeGuid);
    });
  }

  // ---- Read API ----------------------------------------------------------

  servicesInCluster(kubeGuid: string): Signal<KubeService[]> {
    return computed(() => this._clusterServices().get(kubeGuid) ?? []);
  }

  servicesInNamespace(kubeGuid: string, namespace: string): Signal<KubeService[]> {
    return computed(() => this._namespaceServices().get(nsKey(kubeGuid, namespace)) ?? []);
  }

  endpointsInCluster(kubeGuid: string): Signal<KubeEndpoint[]> {
    return computed(() => this._clusterEndpoints().get(kubeGuid) ?? []);
  }

  servicesInWorkload(kubeGuid: string, namespace: string, release: string): Signal<KubeService[]> {
    return computed(() => this._workloadServices().get(workloadKey(kubeGuid, namespace, release)) ?? []);
  }

  setWorkloadServices(kubeGuid: string, namespace: string, release: string, services: KubeService[]): void {
    const items = (services ?? []).map(s => ({
      ...s,
      kubeGuid,
      metadata: { ...(s.metadata ?? { name: '' }), kubeId: kubeGuid },
    })) as KubeService[];
    this._workloadServices.update(curr => {
      const next = new Map(curr);
      next.set(workloadKey(kubeGuid, namespace, release), items);
      return next;
    });
  }

  errors(): Signal<StratosError[]> {
    return this._errors.asReadonly();
  }

  // The failures of the services list for one scope (the cluster, or a
  // namespace when given); endpoints-list failures are not included. A
  // reactive read: call it inside a computed.
  scopeErrors(scope: { kubeGuid: string; namespace?: string }): StratosError[] {
    const key = errorScopeKey(scope);
    return this._errors().filter(e => e.title === 'kube-services' && e.affected?.includes(key));
  }

  // ---- Delete ------------------------------------------------------------

  // Signal-native service delete (replaces the ngrx deleteResource pipeline).
  // DELETEs through the Jetstream proxy, then drops the service from every
  // cached scope. Errors, including the endpoint refusing the delete,
  // propagate to the caller (viewer renders the snackbar).
  async delete(kubeGuid: string, name: string, namespace?: string): Promise<void> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    const url = namespace
      ? `/pp/v1/proxy/api/v1/namespaces/${encodeURIComponent(namespace)}/services/${encodeURIComponent(name)}`
      : `/pp/v1/proxy/api/v1/services/${encodeURIComponent(name)}`;
    await firstValueFrom(this.http.delete<KubeProxyResponse<unknown>>(url, { headers }).pipe(kubeProxyResult(kubeGuid)));
    const drop = (curr: Map<string, KubeService[]>) => {
      const next = new Map(curr);
      for (const [key, arr] of next) {
        const filtered = arr.filter(s => !(s.metadata.kubeId === kubeGuid && s.metadata.name === name));
        if (filtered.length !== arr.length) {
          next.set(key, filtered);
        }
      }
      return next;
    };
    this._clusterServices.update(drop);
    this._namespaceServices.update(drop);
    this._workloadServices.update(drop);
  }

  // ---- Refresh -----------------------------------------------------------

  // Refresh dispatches based on scope. Without a namespace it refreshes
  // both the cluster-wide services AND the cluster-wide endpoints in
  // parallel — both consumers (services list, endpoints list) typically
  // sit on the same route family. A response that lands after the
  // endpoint was evicted carries the old credentials' data, so it is
  // dropped (fetchList drops a late failure).
  async refresh(scope: { kubeGuid: string; namespace?: string }): Promise<void> {
    const live = this.eviction.current(scope.kubeGuid);
    if (scope.namespace) {
      const namespace = scope.namespace;
      const items = await this.fetchNamespacedServices(scope.kubeGuid, namespace);
      if (!live()) return;
      this._namespaceServices.update(curr => {
        const next = new Map(curr);
        next.set(nsKey(scope.kubeGuid, namespace), items);
        return next;
      });
      return;
    }
    const [services, endpoints] = await Promise.all([
      this.fetchClusterServices(scope.kubeGuid),
      this.fetchClusterEndpoints(scope.kubeGuid),
    ]);
    if (!live()) return;
    this._clusterServices.update(curr => {
      const next = new Map(curr);
      next.set(scope.kubeGuid, services);
      return next;
    });
    this._clusterEndpoints.update(curr => {
      const next = new Map(curr);
      next.set(scope.kubeGuid, endpoints);
      return next;
    });
  }

  // ---- HTTP fetchers -----------------------------------------------------

  private async fetchClusterServices(kubeGuid: string): Promise<KubeService[]> {
    const url = `/pp/v1/proxy/api/v1/services?limit=${KUBE_LIST_DEFAULT_LIMIT}`;
    return this.fetchList<KubeService>(url, kubeGuid, 'kube-services', errorScopeKey({ kubeGuid }));
  }

  private async fetchNamespacedServices(kubeGuid: string, namespace: string): Promise<KubeService[]> {
    const url = `/pp/v1/proxy/api/v1/namespaces/${encodeURIComponent(namespace)}/services?limit=${KUBE_LIST_DEFAULT_LIMIT}`;
    return this.fetchList<KubeService>(url, kubeGuid, 'kube-services', errorScopeKey({ kubeGuid, namespace }));
  }

  private async fetchClusterEndpoints(kubeGuid: string): Promise<KubeEndpoint[]> {
    const url = `/pp/v1/proxy/api/v1/endpoints?limit=${KUBE_LIST_DEFAULT_LIMIT}`;
    return this.fetchList<KubeEndpoint>(url, kubeGuid, 'kube-endpoints', errorScopeKey({ kubeGuid }));
  }

  // Generic list fetcher — same shape as KubeNamespaceDataService.fetchDirect:
  // x-cap-cnsi-list header, jetstream wraps the response in a per-CNSI map
  // (an endpoint's error entry is thrown, see kubeProxyResult). A good load
  // clears the earlier errors of its list (title + scope; Retry recovers):
  // services and endpoints load together, so the title keeps them apart.
  private async fetchList<T extends { metadata?: { name?: string } }>(
    url: string,
    kubeGuid: string,
    title: string,
    scopeKey: string,
  ): Promise<Array<T & { kubeGuid: string }>> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    const live = this.eviction.current(kubeGuid);
    try {
      const list = await firstValueFrom(this.http.get<KubeProxyResponse<KubeListResponse<T>>>(
        url,
        { headers },
      ).pipe(kubeProxyResult<KubeListResponse<T>>(kubeGuid)));
      if (live()) {
        const mine = (e: StratosError) => e.title === title && !!e.affected?.includes(scopeKey);
        this._errors.update(curr => curr.some(mine) ? curr.filter(e => !mine(e)) : curr);
      }
      return (list?.items ?? []).map((item) => ({
        ...item,
        kubeGuid,
        metadata: { ...(item.metadata ?? { name: '' }), kubeId: kubeGuid } as T['metadata'],
      })) as Array<T & { kubeGuid: string }>;
    } catch (err) {
      const status = (err as HttpErrorResponse)?.status;
      const code: StratosError['code'] = status === 401 || status === 403 ? 'UNAUTHORIZED' : 'FETCH_ERROR';
      const next: StratosError = {
        scope: 'envelope',
        code,
        title,
        detail: (err as Error)?.message ?? String(err),
        affected: [kubeGuid, scopeKey],
      };
      if (live()) this._errors.update(curr => [...curr, next].slice(-50));
      return [];
    }
  }
}
