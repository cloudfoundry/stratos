import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { KUBE_LIST_DEFAULT_LIMIT, KubeListResponse } from '../endpoint-data/kube-paged-response';
import { KubeEndpointDataRegistry } from '../endpoint-data/kube-endpoint-data.registry';
import { KubePod, KubePodContainerStatus, StratosError } from '../endpoint-data/kube-types';

// Per-resource domain service for k8s pods. Mirrors KubeNamespaceDataService
// in shape — three scope-keyed read entry points:
//
//   podsInCluster(kubeGuid) — all pods cluster-wide
//   podsInNamespace(kubeGuid, ns)
//   podsOnNode(kubeGuid, node) — uses fieldSelector=spec.nodeName=...
//
// Wire model:
//   - Cluster-wide: GET /pp/v1/proxy/api/v1/pods?limit=N
//   - Namespaced:   GET /pp/v1/proxy/api/v1/namespaces/{ns}/pods?limit=N
//   - Node:         GET /pp/v1/proxy/api/v1/pods?fieldSelector=spec.nodeName=N
//   - Auth + endpoint targeting via the `x-cap-cnsi-list` header.
//
// Caching:
//   - 60s TTL per (scope-key) — refresh() forces invalidate.
//   - In-flight dedup via shareReplay(1) — a second read while the first
//     request is on the wire receives the same Observable and resolves
//     against the shared response.
//
// Tristate:
//   - 401 / 403 mark the affected scope unavailable and surface a
//     StratosError on errors().
//   - Other errors push a FETCH_ERROR onto errors().

const POD_TTL_MS = 60_000;
const POD_FETCH_DEDUPE = new Map<string, Observable<KubePod[]>>();

interface CacheEntry {
  items: KubePod[];
  fetchedAt: number;
}

@Injectable({ providedIn: 'root' })
export class KubePodDataService {
  private readonly http = inject(HttpClient);
  private readonly registry = inject(KubeEndpointDataRegistry);

  // Per-scope-key cache of pod lists. Key formats:
  //   cluster:{kubeGuid}
  //   ns:{kubeGuid}:{namespace}
  //   node:{kubeGuid}:{nodeName}
  private readonly _byScope = signal<Map<string, CacheEntry>>(new Map());
  private readonly _errors = signal<StratosError[]>([]);
  private readonly _unavailable = signal<Set<string>>(new Set());

  errors(): Signal<StratosError[]> {
    return this._errors.asReadonly();
  }

  // -- Public read APIs ----------------------------------------------------

  podsInCluster(kubeGuid: string): Signal<KubePod[]> {
    const key = clusterKey(kubeGuid);
    // Fire a load if cache is cold; consumers get [] until the first
    // response lands. This matches the wave-1 namespace pattern (signal
    // populates after refresh).
    void this.ensureLoaded(kubeGuid, key, () => this.fetchClusterPods(kubeGuid));
    return computed(() => this._byScope().get(key)?.items ?? []);
  }

  podsInNamespace(kubeGuid: string, namespace: string): Signal<KubePod[]> {
    const key = nsKey(kubeGuid, namespace);
    void this.ensureLoaded(kubeGuid, key, () => this.fetchNamespacePods(kubeGuid, namespace));
    return computed(() => this._byScope().get(key)?.items ?? []);
  }

  podsOnNode(kubeGuid: string, nodeName: string): Signal<KubePod[]> {
    const key = nodeKey(kubeGuid, nodeName);
    void this.ensureLoaded(kubeGuid, key, () => this.fetchNodePods(kubeGuid, nodeName));
    return computed(() => this._byScope().get(key)?.items ?? []);
  }

  // -- Refresh -------------------------------------------------------------

  // Force a refresh on the matching scope. If only `kubeGuid` is given,
  // refreshes the cluster-wide entry. Pass `namespace` or `nodeName` to
  // target a specific scope.
  async refresh(scope: { kubeGuid: string; namespace?: string; nodeName?: string }): Promise<void> {
    if (scope.namespace) {
      const key = nsKey(scope.kubeGuid, scope.namespace);
      this.invalidate(key);
      await firstValueFrom(this.fetchNamespacePods(scope.kubeGuid, scope.namespace));
      return;
    }
    if (scope.nodeName) {
      const key = nodeKey(scope.kubeGuid, scope.nodeName);
      this.invalidate(key);
      await firstValueFrom(this.fetchNodePods(scope.kubeGuid, scope.nodeName));
      return;
    }
    const key = clusterKey(scope.kubeGuid);
    this.invalidate(key);
    await firstValueFrom(this.fetchClusterPods(scope.kubeGuid));
  }

  // -- Internals -----------------------------------------------------------

  private ensureLoaded(kubeGuid: string, key: string, factory: () => Observable<KubePod[]>): void {
    const entry = this._byScope().get(key);
    if (entry && Date.now() - entry.fetchedAt < POD_TTL_MS) {
      return;
    }
    if (POD_FETCH_DEDUPE.has(key)) {
      return;
    }
    // Touch the registry — guarantees the per-endpoint service exists so
    // cluster-wide diagnostics know about this kubeGuid even if the pods
    // load races ahead of the namespace/version load.
    this.registry.getService(kubeGuid);
    const inflight = factory().pipe(shareReplay(1));
    POD_FETCH_DEDUPE.set(key, inflight);
    inflight.subscribe({
      complete: () => POD_FETCH_DEDUPE.delete(key),
      error: () => POD_FETCH_DEDUPE.delete(key),
    });
  }

  private invalidate(key: string): void {
    this._byScope.update(curr => {
      const next = new Map(curr);
      next.delete(key);
      return next;
    });
    POD_FETCH_DEDUPE.delete(key);
  }

  private fetchClusterPods(kubeGuid: string): Observable<KubePod[]> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    return this.http.get<{ [cnsi: string]: KubeListResponse<KubePod> }>(
      `/pp/v1/proxy/api/v1/pods?limit=${KUBE_LIST_DEFAULT_LIMIT}`,
      { headers },
    ).pipe(
      map(resp => this.absorbResponse(clusterKey(kubeGuid), kubeGuid, resp?.[kubeGuid])),
      catchError((err: HttpErrorResponse | unknown) => {
        this.markUnavailable(clusterKey(kubeGuid), err, 'kube-pods-cluster', kubeGuid);
        this.storeItems(clusterKey(kubeGuid), []);
        return of([] as KubePod[]);
      }),
    );
  }

  private fetchNamespacePods(kubeGuid: string, namespace: string): Observable<KubePod[]> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    return this.http.get<{ [cnsi: string]: KubeListResponse<KubePod> }>(
      `/pp/v1/proxy/api/v1/namespaces/${encodeURIComponent(namespace)}/pods?limit=${KUBE_LIST_DEFAULT_LIMIT}`,
      { headers },
    ).pipe(
      map(resp => this.absorbResponse(nsKey(kubeGuid, namespace), kubeGuid, resp?.[kubeGuid])),
      catchError((err: HttpErrorResponse | unknown) => {
        this.markUnavailable(nsKey(kubeGuid, namespace), err, 'kube-pods-namespace', kubeGuid);
        this.storeItems(nsKey(kubeGuid, namespace), []);
        return of([] as KubePod[]);
      }),
    );
  }

  private fetchNodePods(kubeGuid: string, nodeName: string): Observable<KubePod[]> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    const fieldSelector = encodeURIComponent(`spec.nodeName=${nodeName}`);
    return this.http.get<{ [cnsi: string]: KubeListResponse<KubePod> }>(
      `/pp/v1/proxy/api/v1/pods?limit=${KUBE_LIST_DEFAULT_LIMIT}&fieldSelector=${fieldSelector}`,
      { headers },
    ).pipe(
      map(resp => this.absorbResponse(nodeKey(kubeGuid, nodeName), kubeGuid, resp?.[kubeGuid])),
      catchError((err: HttpErrorResponse | unknown) => {
        this.markUnavailable(nodeKey(kubeGuid, nodeName), err, 'kube-pods-node', kubeGuid);
        this.storeItems(nodeKey(kubeGuid, nodeName), []);
        return of([] as KubePod[]);
      }),
    );
  }

  // Stamp `kubeGuid` + `metadata.kubeId` on each row, derive
  // `expandedStatus` from container statuses, and write into the cache.
  private absorbResponse(key: string, kubeGuid: string, list: KubeListResponse<KubePod> | undefined): KubePod[] {
    const items = (list?.items ?? []).map(p => normalizePod(p, kubeGuid));
    this.storeItems(key, items);
    this.clearUnavailable(key);
    return items;
  }

  private storeItems(key: string, items: KubePod[]): void {
    this._byScope.update(curr => {
      const next = new Map(curr);
      next.set(key, { items, fetchedAt: Date.now() });
      return next;
    });
  }

  private markUnavailable(key: string, err: unknown, title: string, kubeGuid: string): void {
    this._unavailable.update(curr => {
      const next = new Set(curr);
      next.add(key);
      return next;
    });
    const status = (err as HttpErrorResponse)?.status;
    const code: StratosError['code'] =
      status === 401 || status === 403 ? 'UNAUTHORIZED' : 'FETCH_ERROR';
    this._errors.update(curr => [
      ...curr,
      {
        scope: 'envelope',
        code,
        title,
        detail: (err as Error)?.message ?? String(err),
        affected: [kubeGuid],
      },
    ].slice(0, 50));
  }

  private clearUnavailable(key: string): void {
    this._unavailable.update(curr => {
      if (!curr.has(key)) return curr;
      const next = new Set(curr);
      next.delete(key);
      return next;
    });
  }
}

// --- helpers ---------------------------------------------------------------

function clusterKey(kubeGuid: string): string {
  return `cluster:${kubeGuid}`;
}

function nsKey(kubeGuid: string, namespace: string): string {
  return `ns:${kubeGuid}:${namespace}`;
}

function nodeKey(kubeGuid: string, nodeName: string): string {
  return `node:${kubeGuid}:${nodeName}`;
}

function normalizePod(p: KubePod, kubeGuid: string): KubePod {
  return {
    ...p,
    kubeGuid,
    metadata: { ...(p.metadata ?? { name: '' }), kubeId: kubeGuid },
    expandedStatus: computeExpandedStatus(p),
  };
}

// Derive a human-friendly status + restart sum from container statuses.
// Mirrors the legacy `KubernetesPodExpandedStatusHelper` behavior closely
// enough to drive the Status / Restarts columns identically.
function computeExpandedStatus(p: KubePod): { status: string; restarts: number } {
  const cs = p.status?.containerStatuses ?? [];
  const restarts = cs.reduce((sum, c) => sum + (c.restartCount ?? 0), 0);

  // First container in waiting state with a reason wins (CrashLoopBackOff,
  // ImagePullBackOff, etc.); otherwise fall back to the pod phase.
  const waitingReason = cs
    .map(c => readState(c, 'waiting')?.reason)
    .find(r => !!r);
  if (waitingReason) {
    return { status: waitingReason, restarts };
  }
  const terminatedReason = cs
    .map(c => readState(c, 'terminated')?.reason)
    .find(r => !!r);
  if (terminatedReason && p.status?.phase !== 'Running') {
    return { status: terminatedReason, restarts };
  }
  return { status: p.status?.phase ?? 'Unknown', restarts };
}

function readState(
  c: KubePodContainerStatus,
  k: 'waiting' | 'running' | 'terminated',
): { reason?: string; message?: string; exitCode?: number; startedAt?: string } | undefined {
  return c.state?.[k];
}
