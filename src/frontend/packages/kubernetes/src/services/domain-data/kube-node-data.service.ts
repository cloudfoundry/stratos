import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { KUBE_LIST_DEFAULT_LIMIT, KubeListResponse } from '../endpoint-data/kube-paged-response';
import { KubeNode, StratosError } from '../endpoint-data/kube-types';
import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';

// Per-resource domain service for k8s nodes. Same shape as
// KubeNamespaceDataService — caches per-endpoint node lists, exposes
// signal getters for consumers, delegates refresh through HTTP. Nodes
// are cluster-scoped (no namespace dimension), so the surface is
// simpler: nodesInCluster + refresh + errors.

@Injectable({ providedIn: 'root' })
export class KubeNodeDataService {
  private readonly http = inject(HttpClient);
  private readonly registry = inject(KubeEndpointDataRegistry);

  // Per-endpoint node cache. Independent of the endpoint-service's
  // node *count* signal (which only tracks the count for the cluster
  // summary card). When a consumer needs the full list it goes through
  // this cache so multiple pages on the same endpoint share one fetch.
  private readonly _nodes = signal<Map<string, KubeNode[]>>(new Map());
  private readonly _errors = signal<StratosError[]>([]);

  // Signal projecting the cached nodes for a given endpoint. Composed
  // via computed() so consumers re-render when the underlying map
  // changes.
  nodesInCluster(kubeGuid: string): Signal<KubeNode[]> {
    return computed(() => this._nodes().get(kubeGuid) ?? []);
  }

  // Force a fresh fetch. Pushes the result into the per-endpoint cache
  // so signal projections light up. Updates the endpoint-service's node
  // *count* signal as a side-effect so the cluster summary card stays
  // coherent.
  async refresh(kubeGuid: string): Promise<void> {
    const items = await this.fetchNodes(kubeGuid);
    this._nodes.update(curr => {
      const next = new Map(curr);
      next.set(kubeGuid, items);
      return next;
    });
    // Best-effort sync of the endpoint-service node count. Side-effect
    // is contained here so the wave-2 scope doesn't have to reach into
    // KubeEndpointDataService internals.
    try {
      const svc = this.registry.getService(kubeGuid) as unknown as {
        _nodeCount?: { set?: (n: number) => void };
      };
      if (svc?._nodeCount?.set) {
        svc._nodeCount.set(items.length);
      }
    } catch {
      // non-fatal; endpoint cluster card recomputes on next refresh
    }
  }

  errors(): Signal<StratosError[]> {
    return this._errors.asReadonly();
  }

  private async fetchNodes(kubeGuid: string): Promise<KubeNode[]> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    try {
      const resp = await firstValueFrom(this.http.get<{ [cnsi: string]: KubeListResponse<KubeNode> }>(
        `/pp/v1/proxy/api/v1/nodes?limit=${KUBE_LIST_DEFAULT_LIMIT}`,
        { headers },
      ));
      const list = resp?.[kubeGuid];
      return (list?.items ?? []).map(n => ({
        ...n,
        kubeGuid,
        metadata: { ...(n.metadata ?? { name: '' }), kubeId: kubeGuid },
      }));
    } catch (err) {
      const status = (err as HttpErrorResponse)?.status;
      const code: StratosError['code'] = status === 401 || status === 403 ? 'UNAUTHORIZED' : 'FETCH_ERROR';
      this._errors.update(curr => [...curr, {
        scope: 'envelope',
        code,
        title: 'kube-nodes',
        detail: (err as Error)?.message ?? String(err),
        affected: [kubeGuid],
      }].slice(0, 50));
      return [];
    }
  }
}
