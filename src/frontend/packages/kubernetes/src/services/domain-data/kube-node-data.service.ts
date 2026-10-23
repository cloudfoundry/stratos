import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { KUBE_LIST_DEFAULT_LIMIT, KubeListResponse } from '../endpoint-data/kube-paged-response';
import { KubeLoadTracker } from '../endpoint-data/kube-load-tracker';
import { KubeProxyResponse, kubeProxyResult } from '../endpoint-data/kube-proxy-response';
import { KubeNode, StratosError } from '../endpoint-data/kube-types';
import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';
import { KubeEndpointEviction, evictErrors, evictKeys } from '../endpoint-data/kube-endpoint-eviction';

// Per-resource domain service for k8s nodes. Same shape as
// KubeNamespaceDataService — caches per-endpoint node lists, exposes
// signal getters for consumers, delegates refresh through HTTP. Nodes
// are cluster-scoped (no namespace dimension), so the surface is
// simpler: nodesInCluster + refresh + errors.

@Injectable({ providedIn: 'root' })
export class KubeNodeDataService {
  private readonly http = inject(HttpClient);
  private readonly registry = inject(KubeEndpointDataRegistry);
  private readonly eviction = inject(KubeEndpointEviction);

  // Per-endpoint node cache. Independent of the endpoint-service's
  // node *count* signal (which only tracks the count for the cluster
  // summary card). When a consumer needs the full list it goes through
  // this cache so multiple pages on the same endpoint share one fetch.
  private readonly _nodes = signal<Map<string, KubeNode[]>>(new Map());
  private readonly _errors = signal<StratosError[]>([]);
  private readonly loads = new KubeLoadTracker();

  constructor() {
    this.eviction.register(kubeGuid => {
      evictKeys(this._nodes, key => key === kubeGuid);
      evictErrors(this._errors, kubeGuid);
    });
  }

  // Signal projecting the cached nodes for a given endpoint. Composed
  // via computed() so consumers re-render when the underlying map
  // changes.
  nodesInCluster(kubeGuid: string): Signal<KubeNode[]> {
    return computed(() => this._nodes().get(kubeGuid) ?? []);
  }

  // Single-node projection by name — derived from the cluster cache. Callers
  // that need a specific node (e.g. the node detail page) refresh() first,
  // then read this signal.
  nodeByName(kubeGuid: string, name: string): Signal<KubeNode | undefined> {
    return computed(() => this.nodesInCluster(kubeGuid)().find(n => n.metadata.name === name));
  }

  // Force a fresh fetch. Pushes the result into the per-endpoint cache
  // so signal projections light up. Updates the endpoint-service's node
  // *count* signal as a side-effect so the cluster summary card stays
  // coherent. A response that lands after the endpoint was evicted
  // carries the old credentials' data, so it is dropped; skipping the
  // count sync also keeps the registry from rebuilding the departed entry.
  async refresh(kubeGuid: string): Promise<void> {
    const live = this.eviction.current(kubeGuid);
    const items = await this.fetchNodes(kubeGuid);
    if (!live()) return;
    this._nodes.update(curr => {
      const next = new Map(curr);
      next.set(kubeGuid, items);
      return next;
    });
    // Keep the endpoint service's node count in step with this list.
    this.registry.getService(kubeGuid).syncNodeCount(items.length);
  }

  errors(): Signal<StratosError[]> {
    return this._errors.asReadonly();
  }

  // Whether the endpoint's node list is loading. A reactive read.
  loading(kubeGuid: string): boolean {
    return this.loads.isLoading(kubeGuid);
  }

  private async fetchNodes(kubeGuid: string): Promise<KubeNode[]> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    const live = this.eviction.current(kubeGuid);
    const loaded = this.loads.start(kubeGuid);
    try {
      const list = await firstValueFrom(this.http.get<KubeProxyResponse<KubeListResponse<KubeNode>>>(
        `/pp/v1/proxy/api/v1/nodes?limit=${KUBE_LIST_DEFAULT_LIMIT}`,
        { headers },
      ).pipe(kubeProxyResult<KubeListResponse<KubeNode>>(kubeGuid)));
      // A good load clears the endpoint's earlier errors (Retry recovers).
      if (live()) evictErrors(this._errors, kubeGuid);
      return (list?.items ?? []).map(n => ({
        ...n,
        kubeGuid,
        metadata: { ...(n.metadata ?? { name: '' }), kubeId: kubeGuid },
      }));
    } catch (err) {
      const status = (err as HttpErrorResponse)?.status;
      const code: StratosError['code'] = status === 401 || status === 403 ? 'UNAUTHORIZED' : 'FETCH_ERROR';
      const next: StratosError = {
        scope: 'envelope',
        code,
        title: 'kube-nodes',
        detail: (err as Error)?.message ?? String(err),
        affected: [kubeGuid],
      };
      if (live()) this._errors.update(curr => [...curr, next].slice(-50));
      return [];
    } finally {
      loaded();
    }
  }
}
