import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { KUBE_LIST_DEFAULT_LIMIT, KubeListResponse } from '../endpoint-data/kube-paged-response';
import { KubeNamespace, StratosError } from '../endpoint-data/kube-types';
import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';

// Per-resource domain service for k8s namespaces. Composes over
// KubeEndpointDataRegistry to share the cluster-scoped namespace cache
// when a page only needs a read; falls back to a direct fetch when a
// caller wants cross-endpoint aggregation or a forced refresh.
//
// Wave-1 surface intentionally minimal — `namespacesForEndpoint`,
// `allNamespacesAcrossEndpoints` (folded for the cluster-scoped page),
// `refresh`, and `errors`. Wave-2 services (pods/nodes/etc.) follow the
// same shape and will lift more methods as needed.

@Injectable({ providedIn: 'root' })
export class KubeNamespaceDataService {
  private readonly http = inject(HttpClient);
  private readonly registry = inject(KubeEndpointDataRegistry);

  // Per-endpoint independent fetch cache. Used for refresh() — the
  // primary read path goes through registry.getService(kubeGuid)
  // .namespaces() so multiple consumers on the same endpoint share data.
  private readonly _directNamespaces = signal<Map<string, KubeNamespace[]>>(new Map());
  private readonly _errors = signal<StratosError[]>([]);

  // Returns a signal projecting the namespaces cached on the per-endpoint
  // service. Composing with `computed` keeps the projection reactive —
  // when load()/refresh() updates the underlying signal the consumer
  // recomputes.
  namespacesForEndpoint(kubeGuid: string): Signal<KubeNamespace[]> {
    const svc = this.registry.getService(kubeGuid);
    return computed(() => svc.namespaces());
  }

  // Single-namespace projection by name — derived from the per-endpoint
  // cache. Callers (e.g. the namespace detail page) refresh() first.
  namespaceByName(kubeGuid: string, name: string): Signal<KubeNamespace | undefined> {
    const list = this.namespacesForEndpoint(kubeGuid);
    return computed(() => list().find(ns => ns.metadata.name === name));
  }

  // Cross-endpoint aggregation. Wave-1 ships the single-endpoint page
  // so this folds to namespacesForEndpoint when only one kubeGuid is
  // active. Wave-2 multi-endpoint pages can pass an array of kubeGuids.
  allNamespacesAcrossEndpoints(kubeGuids: readonly string[]): Signal<KubeNamespace[]> {
    const projections = kubeGuids.map(g => this.namespacesForEndpoint(g));
    return computed(() => projections.flatMap(p => p()));
  }

  // Force a refresh on the named endpoint. Delegates to the per-endpoint
  // service so cache + signals stay coherent across consumers.
  async refresh(scope: { kubeGuid: string }): Promise<void> {
    await this.registry.getService(scope.kubeGuid).refresh('namespaces');
  }

  // Create a namespace on the target endpoint. POSTs through the jetstream
  // proxy (single-endpoint, targeted by the x-cap-cnsi-list header) and
  // rejects on a non-2xx so the caller can surface the failure. Refreshes
  // the per-endpoint cache on success so the new namespace appears.
  async create(kubeGuid: string, name: string): Promise<void> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    await firstValueFrom(this.http.post('/pp/v1/proxy/api/v1/namespaces', { metadata: { name } }, { headers }));
    await this.refresh({ kubeGuid });
  }

  errors(): Signal<StratosError[]> {
    return this._errors.asReadonly();
  }

  // Direct fetch escape-hatch — bypasses the per-endpoint cache. Used
  // by ad-hoc consumers (e.g. dropdown population on a wizard) that
  // want a snapshot but don't need to share the result with the page-
  // level signal. Returns the raw items; errors are accumulated on the
  // service-level errors signal.
  async fetchDirect(kubeGuid: string): Promise<KubeNamespace[]> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    try {
      const resp = await firstValueFrom(this.http.get<{ [cnsi: string]: KubeListResponse<KubeNamespace> }>(
        `/pp/v1/proxy/api/v1/namespaces?limit=${KUBE_LIST_DEFAULT_LIMIT}`,
        { headers },
      ));
      const list = resp?.[kubeGuid];
      const items = (list?.items ?? []).map(ns => ({
        ...ns,
        kubeGuid,
        metadata: { ...(ns.metadata ?? { name: '' }), kubeId: kubeGuid },
      }));
      this._directNamespaces.update(curr => {
        const next = new Map(curr);
        next.set(kubeGuid, items);
        return next;
      });
      return items;
    } catch (err) {
      const status = (err as HttpErrorResponse)?.status;
      const code: StratosError['code'] = status === 401 || status === 403 ? 'UNAUTHORIZED' : 'FETCH_ERROR';
      const next: StratosError = {
        scope: 'envelope',
        code,
        title: 'kube-namespaces-direct',
        detail: (err as Error)?.message ?? String(err),
        affected: [kubeGuid],
      };
      this._errors.update(curr => [...curr, next].slice(0, 50));
      return [];
    }
  }
}
