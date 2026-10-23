import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { KUBE_LIST_DEFAULT_LIMIT, KubeListResponse } from '../endpoint-data/kube-paged-response';
import { KubeProxyResponse, kubeProxyResult } from '../endpoint-data/kube-proxy-response';
import { KubeNamespace, StratosError } from '../endpoint-data/kube-types';
import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';
import { KubeEndpointEviction, evictErrors } from '../endpoint-data/kube-endpoint-eviction';

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
  private readonly eviction = inject(KubeEndpointEviction);

  private readonly _errors = signal<StratosError[]>([]);

  // The namespace list itself lives on the per-endpoint service, which the
  // registry drops; only fetchDirect's errors are held here.
  constructor() {
    this.eviction.register(kubeGuid => evictErrors(this._errors, kubeGuid));
  }

  // Returns a signal projecting the namespaces cached on the per-endpoint
  // service. Composing with `computed` keeps the projection reactive —
  // when load()/refresh() updates the underlying signal the consumer
  // recomputes. The registry drops that service when the endpoint leaves
  // (the hook evicts in the same step), so the projection re-resolves it
  // on each eviction rather than holding the orphaned instance. Untracked:
  // the lookup may construct the service, which writes its signals.
  namespacesForEndpoint(kubeGuid: string): Signal<KubeNamespace[]> {
    return computed(() => {
      this.eviction.epoch(kubeGuid);
      return untracked(() => this.registry.getService(kubeGuid)).namespaces();
    });
  }

  // The namespace list's load errors for the endpoint. They live on the
  // per-endpoint service (tagged 'namespaces'; load() and
  // refresh('namespaces') clear them), re-resolved after an eviction
  // like namespacesForEndpoint.
  listErrors(kubeGuid: string): Signal<StratosError[]> {
    return computed(() => this.namespaceListErrors(kubeGuid));
  }

  // listErrors as a plain reactive read (call it inside a computed).
  namespaceListErrors(kubeGuid: string): StratosError[] {
    this.eviction.epoch(kubeGuid);
    return untracked(() => this.registry.getService(kubeGuid)).errors()
      .filter(e => e.affected?.includes('namespaces'));
  }

  // Whether the endpoint's namespace list is loading; resolved like
  // listErrors.
  listLoading(kubeGuid: string): Signal<boolean> {
    return computed(() => {
      this.eviction.epoch(kubeGuid);
      return untracked(() => this.registry.getService(kubeGuid)).namespacesLoading();
    });
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
  // rejects on a non-2xx or the endpoint's error entry so the caller can
  // surface the failure. Refreshes
  // the per-endpoint cache on success so the new namespace appears.
  async create(kubeGuid: string, name: string): Promise<void> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    await firstValueFrom(this.http.post<KubeProxyResponse<unknown>>('/pp/v1/proxy/api/v1/namespaces', { metadata: { name } }, { headers })
      .pipe(kubeProxyResult(kubeGuid)));
    await this.refresh({ kubeGuid });
  }

  errors(): Signal<StratosError[]> {
    return this._errors.asReadonly();
  }

  // Direct fetch escape-hatch — bypasses the per-endpoint cache. Used
  // by ad-hoc consumers (e.g. dropdown population on a wizard) that
  // want a snapshot but don't need to share the result with the page-
  // level signal. Returns the raw items without caching them, so a
  // disconnected endpoint leaves nothing behind; errors are accumulated
  // on the service-level errors signal.
  async fetchDirect(kubeGuid: string): Promise<KubeNamespace[]> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    try {
      const list = await firstValueFrom(this.http.get<KubeProxyResponse<KubeListResponse<KubeNamespace>>>(
        `/pp/v1/proxy/api/v1/namespaces?limit=${KUBE_LIST_DEFAULT_LIMIT}`,
        { headers },
      ).pipe(kubeProxyResult<KubeListResponse<KubeNamespace>>(kubeGuid)));
      return (list?.items ?? []).map(ns => ({
        ...ns,
        kubeGuid,
        metadata: { ...(ns.metadata ?? { name: '' }), kubeId: kubeGuid },
      }));
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
      this._errors.update(curr => [...curr, next].slice(-50));
      return [];
    }
  }
}
