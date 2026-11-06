import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Signal, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { KUBE_LIST_DEFAULT_LIMIT, KubeListResponse } from '../endpoint-data/kube-paged-response';
import { StratosError } from '../endpoint-data/kube-types';

// Shared base for the wave-3 generic-resource domain services
// (configMap, secret, deployment, replicaSet, statefulSet, persistentVolume,
// persistentVolumeClaim, storageClass, job, role, clusterRole,
// serviceAccount). Each subclass plugs in:
//   - apiPath:  the /api/v1 or /apis/.../vN segment
//   - resourceName:  the trailing collection name (e.g. 'configmaps')
//   - namespaced:  true for namespace-scoped resources (else cluster-only)
//   - title:  short error label for StratosError envelopes
//
// Mirrors KubeServiceDataService's eager-refresh shape — no TTL/dedup.
// Consumers call refresh() which dispatches the right HTTP fetch and
// updates the cache; reads come back through clusterItems() /
// itemsInNamespace() signal projections.

export interface KubeGenericResourceConfig {
  apiPath: string;        // e.g. '/api/v1', '/apis/apps/v1', '/apis/storage.k8s.io/v1'
  resourceName: string;   // e.g. 'configmaps', 'persistentvolumes'
  namespaced: boolean;    // true if /namespaces/{ns}/{resourceName} is valid
  title: string;          // short label used in StratosError 'title'
}

const nsKey = (kubeGuid: string, namespace: string) => `${kubeGuid}/${namespace}`;
const workloadKey = (kubeGuid: string, namespace: string, release: string) =>
  `${kubeGuid}/${namespace}/${release}`;

export abstract class KubeGenericResourceDataServiceBase<T extends { metadata: { name: string; namespace?: string; kubeId?: string; creationTimestamp?: string } }> {
  protected abstract readonly http: HttpClient;
  protected abstract readonly config: KubeGenericResourceConfig;

  private readonly _clusterItems = signal<Map<string, Array<T & { kubeGuid: string }>>>(new Map());
  private readonly _namespaceItems = signal<Map<string, Array<T & { kubeGuid: string }>>>(new Map());
  private readonly _workloadItems = signal<Map<string, Array<T & { kubeGuid: string }>>>(new Map());
  private readonly _errors = signal<StratosError[]>([]);

  // ---- Read API ----------------------------------------------------------

  itemsInCluster(kubeGuid: string): Signal<Array<T & { kubeGuid: string }>> {
    return computed(() => this._clusterItems().get(kubeGuid) ?? []);
  }

  itemsInNamespace(kubeGuid: string, namespace: string): Signal<Array<T & { kubeGuid: string }>> {
    return computed(() => this._namespaceItems().get(nsKey(kubeGuid, namespace)) ?? []);
  }

  itemsInWorkload(kubeGuid: string, namespace: string, release: string): Signal<Array<T & { kubeGuid: string }>> {
    return computed(() => this._workloadItems().get(workloadKey(kubeGuid, namespace, release)) ?? []);
  }

  setWorkloadItems(kubeGuid: string, namespace: string, release: string, items: T[]): void {
    const stamped = (items ?? []).map((item) => ({
      ...item,
      kubeGuid,
      metadata: { ...((item.metadata ?? { name: '' }) as T['metadata']), kubeId: kubeGuid } as T['metadata'],
    })) as Array<T & { kubeGuid: string }>;
    this._workloadItems.update(curr => {
      const next = new Map(curr);
      next.set(workloadKey(kubeGuid, namespace, release), stamped);
      return next;
    });
  }

  errors(): Signal<StratosError[]> {
    return this._errors.asReadonly();
  }

  // ---- Refresh -----------------------------------------------------------

  // Refresh dispatches based on scope. Without a namespace it refreshes
  // the cluster-wide list. Cluster-only resources (PV, StorageClass,
  // ClusterRole) ignore the `namespace` field and always fetch cluster.
  async refresh(scope: { kubeGuid: string; namespace?: string }): Promise<void> {
    if (scope.namespace && this.config.namespaced) {
      const items = await this.fetchNamespaced(scope.kubeGuid, scope.namespace);
      this._namespaceItems.update(curr => {
        const next = new Map(curr);
        next.set(nsKey(scope.kubeGuid, scope.namespace as string), items);
        return next;
      });
      return;
    }
    const items = await this.fetchCluster(scope.kubeGuid);
    this._clusterItems.update(curr => {
      const next = new Map(curr);
      next.set(scope.kubeGuid, items);
      return next;
    });
  }

  // ---- Delete ------------------------------------------------------------

  // Signal-native resource delete (replaces the ngrx `deleteResource` action +
  // generic delete pipeline). DELETEs the k8s resource through the Jetstream
  // proxy, then drops the row from every cached scope so the lists/graph that
  // read these signals update immediately. Errors propagate to the caller
  // (the resource viewer renders the failure snackbar). Favorites/recents
  // cleanup is performed by the caller, which holds the catalog entity type.
  async delete(kubeGuid: string, name: string, namespace?: string): Promise<void> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    const base = `/pp/v1/proxy${this.config.apiPath}`;
    const url = (namespace && this.config.namespaced)
      ? `${base}/namespaces/${encodeURIComponent(namespace)}/${this.config.resourceName}/${encodeURIComponent(name)}`
      : `${base}/${this.config.resourceName}/${encodeURIComponent(name)}`;
    await firstValueFrom(this.http.delete(url, { headers }));
    this.removeRow(kubeGuid, name);
  }

  // Drop the named row (matched by kubeGuid + metadata.name) from every cached
  // scope — cluster, namespace and workload — so any view reading these
  // signals reflects the deletion without a refetch.
  private removeRow(kubeGuid: string, name: string): void {
    const matches = (item: T & { kubeGuid: string }) =>
      item.kubeGuid === kubeGuid && item.metadata?.name === name;
    const drop = (curr: Map<string, Array<T & { kubeGuid: string }>>) => {
      const next = new Map(curr);
      for (const [key, arr] of next) {
        const filtered = arr.filter(item => !matches(item));
        if (filtered.length !== arr.length) {
          next.set(key, filtered);
        }
      }
      return next;
    };
    this._clusterItems.update(drop);
    this._namespaceItems.update(drop);
    this._workloadItems.update(drop);
  }

  // ---- HTTP fetchers -----------------------------------------------------

  private async fetchCluster(kubeGuid: string): Promise<Array<T & { kubeGuid: string }>> {
    const url = `/pp/v1/proxy${this.config.apiPath}/${this.config.resourceName}?limit=${KUBE_LIST_DEFAULT_LIMIT}`;
    return this.fetchList(url, kubeGuid);
  }

  private async fetchNamespaced(kubeGuid: string, namespace: string): Promise<Array<T & { kubeGuid: string }>> {
    const url = `/pp/v1/proxy${this.config.apiPath}/namespaces/${encodeURIComponent(namespace)}/${this.config.resourceName}?limit=${KUBE_LIST_DEFAULT_LIMIT}`;
    return this.fetchList(url, kubeGuid);
  }

  // Generic list fetcher — same shape as KubeServiceDataService.fetchList:
  // x-cap-cnsi-list header, jetstream wraps the response in a per-CNSI map.
  // Stamps `kubeGuid` + `metadata.kubeId` on each row.
  private async fetchList(url: string, kubeGuid: string): Promise<Array<T & { kubeGuid: string }>> {
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
        metadata: { ...((item.metadata ?? { name: '' }) as T['metadata']), kubeId: kubeGuid } as T['metadata'],
      })) as Array<T & { kubeGuid: string }>;
    } catch (err) {
      const status = (err as HttpErrorResponse)?.status;
      const code: StratosError['code'] = status === 401 || status === 403 ? 'UNAUTHORIZED' : 'FETCH_ERROR';
      const next: StratosError = {
        scope: 'envelope',
        code,
        title: this.config.title,
        detail: (err as Error)?.message ?? String(err),
        affected: [kubeGuid],
      };
      this._errors.update(curr => [...curr, next].slice(0, 50));
      return [];
    }
  }
}
