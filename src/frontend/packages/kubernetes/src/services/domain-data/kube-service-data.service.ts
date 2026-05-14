import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { KUBE_LIST_DEFAULT_LIMIT, KubeListResponse } from '../endpoint-data/kube-paged-response';
import { KubeEndpoint, KubeService, StratosError } from '../endpoint-data/kube-types';
import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';

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

@Injectable({ providedIn: 'root' })
export class KubeServiceDataService {
  private readonly http = inject(HttpClient);
  // Declared so the registry stays a transitive dep of this service —
  // mirrors KubeNamespaceDataService and gives wave-3 a hook to attach
  // service-count to the cluster summary card without re-injecting.
  private readonly registry = inject(KubeEndpointDataRegistry);

  private readonly _clusterServices = signal<Map<string, KubeService[]>>(new Map());
  private readonly _namespaceServices = signal<Map<string, KubeService[]>>(new Map());
  private readonly _clusterEndpoints = signal<Map<string, KubeEndpoint[]>>(new Map());
  private readonly _errors = signal<StratosError[]>([]);

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

  errors(): Signal<StratosError[]> {
    return this._errors.asReadonly();
  }

  // ---- Refresh -----------------------------------------------------------

  // Refresh dispatches based on scope. Without a namespace it refreshes
  // both the cluster-wide services AND the cluster-wide endpoints in
  // parallel — both consumers (services list, endpoints list) typically
  // sit on the same route family.
  async refresh(scope: { kubeGuid: string; namespace?: string }): Promise<void> {
    if (scope.namespace) {
      const items = await this.fetchNamespacedServices(scope.kubeGuid, scope.namespace);
      this._namespaceServices.update(curr => {
        const next = new Map(curr);
        next.set(nsKey(scope.kubeGuid, scope.namespace), items);
        return next;
      });
      return;
    }
    const [services, endpoints] = await Promise.all([
      this.fetchClusterServices(scope.kubeGuid),
      this.fetchClusterEndpoints(scope.kubeGuid),
    ]);
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
    return this.fetchList<KubeService>(url, kubeGuid, 'kube-services');
  }

  private async fetchNamespacedServices(kubeGuid: string, namespace: string): Promise<KubeService[]> {
    const url = `/pp/v1/proxy/api/v1/namespaces/${encodeURIComponent(namespace)}/services?limit=${KUBE_LIST_DEFAULT_LIMIT}`;
    return this.fetchList<KubeService>(url, kubeGuid, 'kube-services');
  }

  private async fetchClusterEndpoints(kubeGuid: string): Promise<KubeEndpoint[]> {
    const url = `/pp/v1/proxy/api/v1/endpoints?limit=${KUBE_LIST_DEFAULT_LIMIT}`;
    return this.fetchList<KubeEndpoint>(url, kubeGuid, 'kube-endpoints');
  }

  // Generic list fetcher — same shape as KubeNamespaceDataService.fetchDirect:
  // x-cap-cnsi-list header, jetstream wraps the response in a per-CNSI map.
  private async fetchList<T extends { metadata?: { name?: string } }>(
    url: string,
    kubeGuid: string,
    title: string,
  ): Promise<Array<T & { kubeGuid: string }>> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    try {
      const resp = await firstValueFrom(this.http.get<{ [cnsi: string]: KubeListResponse<T> }>(
        url,
        { headers },
      ));
      const list = resp?.[kubeGuid];
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
        affected: [kubeGuid],
      };
      this._errors.update(curr => [...curr, next].slice(0, 50));
      return [];
    }
  }
}
