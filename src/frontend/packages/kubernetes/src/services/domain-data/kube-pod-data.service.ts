import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { KUBE_LIST_DEFAULT_LIMIT, KubeListResponse } from '../endpoint-data/kube-paged-response';
import { KubeProxyResponse, kubeProxyResult } from '../endpoint-data/kube-proxy-response';
import { KubeEndpointEviction, evictErrors, evictKeys } from '../endpoint-data/kube-endpoint-eviction';
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
//   - A later successful load of that scope clears both.

const POD_TTL_MS = 60_000;
const POD_FETCH_DEDUPE = new Map<string, Observable<KubePod[]>>();

interface CacheEntry {
  items: KubePod[];
  fetchedAt: number;
}

@Injectable({ providedIn: 'root' })
export class KubePodDataService {
  private readonly http = inject(HttpClient);
  private readonly eviction = inject(KubeEndpointEviction);

  // Per-scope-key cache of pod lists. Key formats:
  //   cluster:{kubeGuid}
  //   ns:{kubeGuid}:{namespace}
  //   node:{kubeGuid}:{nodeName}
  private readonly _byScope = signal<Map<string, CacheEntry>>(new Map());
  private readonly _errors = signal<StratosError[]>([]);
  private readonly _unavailable = signal<Set<string>>(new Set());

  constructor() {
    this.eviction.register(kubeGuid => this.evictEndpoint(kubeGuid));
  }

  errors(): Signal<StratosError[]> {
    return this._errors.asReadonly();
  }

  // The failures of the pod list for one scope: a node's pods, a
  // namespace's, or the whole cluster's. A reactive read: call it inside
  // a computed.
  scopeErrors(scope: { kubeGuid: string; namespace?: string; nodeName?: string }): StratosError[] {
    const key = scope.namespace ? nsKey(scope.kubeGuid, scope.namespace)
      : scope.nodeName ? nodeKey(scope.kubeGuid, scope.nodeName)
        : clusterKey(scope.kubeGuid);
    return this._errors().filter(e => e.affected?.includes(key));
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

  // Single-pod projection by name. Namespaced when a namespace is given
  // (the detail/metrics pages know it), else cluster-scoped. Reads through
  // the scope getter so the underlying list auto-loads.
  podByName(kubeGuid: string, name: string, namespace?: string): Signal<KubePod | undefined> {
    const list = namespace ? this.podsInNamespace(kubeGuid, namespace) : this.podsInCluster(kubeGuid);
    return computed(() => list().find(p => p.metadata.name === name));
  }

  // Push-only: data arrives via the HelmRelease websocket stream, never
  // REST-fetched, so no ensureLoaded call here.
  podsInWorkload(kubeGuid: string, namespace: string, release: string): Signal<KubePod[]> {
    const key = workloadKey(kubeGuid, namespace, release);
    return computed(() => this._byScope().get(key)?.items ?? []);
  }

  // Socket-fed write path: HelmReleaseSocketService pushes the release's
  // pods from the /status manifest stream. Normalize through the same
  // normalizePod() the REST paths use so expandedStatus/kubeId match.
  setWorkloadPods(kubeGuid: string, namespace: string, release: string, pods: KubePod[]): void {
    const items = (pods ?? []).map(p => normalizePod(p, kubeGuid));
    this.storeItems(workloadKey(kubeGuid, namespace, release), items);
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
    // No registry touch here: KubeEndpointRegistryHook creates the
    // per-endpoint service on connect, and a read for a departed guid
    // (a page still open after the disconnect) must not re-create it.
    const inflight = factory().pipe(shareReplay(1));
    POD_FETCH_DEDUPE.set(key, inflight);
    // An eviction or refresh may have replaced this entry with a newer
    // request; only remove our own.
    const settle = () => {
      if (POD_FETCH_DEDUPE.get(key) === inflight) POD_FETCH_DEDUPE.delete(key);
    };
    inflight.subscribe({ complete: settle, error: settle });
  }

  // Every key format has the kubeGuid as its second segment.
  private evictEndpoint(kubeGuid: string): void {
    const owned = (key: string) => key.split(':')[1] === kubeGuid;
    evictKeys(this._byScope, owned);
    [...POD_FETCH_DEDUPE.keys()].filter(owned).forEach(key => POD_FETCH_DEDUPE.delete(key));
    this._unavailable.update(curr => [...curr].some(owned) ? new Set([...curr].filter(key => !owned(key))) : curr);
    evictErrors(this._errors, kubeGuid, a => a === kubeGuid || owned(a));
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
    return this.fetchPods(kubeGuid, clusterKey(kubeGuid), 'kube-pods-cluster',
      `/pp/v1/proxy/api/v1/pods?limit=${KUBE_LIST_DEFAULT_LIMIT}`);
  }

  private fetchNamespacePods(kubeGuid: string, namespace: string): Observable<KubePod[]> {
    return this.fetchPods(kubeGuid, nsKey(kubeGuid, namespace), 'kube-pods-namespace',
      `/pp/v1/proxy/api/v1/namespaces/${encodeURIComponent(namespace)}/pods?limit=${KUBE_LIST_DEFAULT_LIMIT}`);
  }

  private fetchNodePods(kubeGuid: string, nodeName: string): Observable<KubePod[]> {
    const fieldSelector = encodeURIComponent(`spec.nodeName=${nodeName}`);
    return this.fetchPods(kubeGuid, nodeKey(kubeGuid, nodeName), 'kube-pods-node',
      `/pp/v1/proxy/api/v1/pods?limit=${KUBE_LIST_DEFAULT_LIMIT}&fieldSelector=${fieldSelector}`);
  }

  // A response that lands after the endpoint was evicted carries the old
  // credentials' data, so it is dropped, success or failure.
  private fetchPods(kubeGuid: string, key: string, title: string, url: string): Observable<KubePod[]> {
    const live = this.eviction.current(kubeGuid);
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    return this.http.get<KubeProxyResponse<KubeListResponse<KubePod>>>(url, { headers }).pipe(
      kubeProxyResult<KubeListResponse<KubePod>>(kubeGuid),
      map(list => live() ? this.absorbResponse(key, kubeGuid, list) : []),
      catchError((err: HttpErrorResponse | unknown) => {
        if (live()) {
          this.markUnavailable(key, err, title, kubeGuid);
          this.storeItems(key, []);
        }
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

  // -- Delete --------------------------------------------------------------

  // Signal-native pod delete (replaces the ngrx deleteResource pipeline).
  // DELETEs through the Jetstream proxy, then drops the pod from every cached
  // scope so the lists/graph update immediately. Errors, including the
  // endpoint refusing the delete, propagate to the caller (resource viewer
  // renders the failure snackbar).
  async delete(kubeGuid: string, name: string, namespace?: string): Promise<void> {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': kubeGuid });
    const url = namespace
      ? `/pp/v1/proxy/api/v1/namespaces/${encodeURIComponent(namespace)}/pods/${encodeURIComponent(name)}`
      : `/pp/v1/proxy/api/v1/pods/${encodeURIComponent(name)}`;
    await firstValueFrom(this.http.delete<KubeProxyResponse<unknown>>(url, { headers }).pipe(kubeProxyResult(kubeGuid)));
    this._byScope.update(curr => {
      const next = new Map(curr);
      for (const [key, entry] of next) {
        const filtered = entry.items.filter(p => !(p.metadata.kubeId === kubeGuid && p.metadata.name === name));
        if (filtered.length !== entry.items.length) {
          next.set(key, { ...entry, items: filtered });
        }
      }
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
    const next: StratosError = {
      scope: 'envelope',
      code,
      title,
      detail: (err as Error)?.message ?? String(err),
      // The scope key lets a later successful load of this scope clear it.
      affected: [kubeGuid, key],
    };
    this._errors.update(curr => [...curr, next].slice(-50));
  }

  private clearUnavailable(key: string): void {
    this._unavailable.update(curr => {
      if (!curr.has(key)) return curr;
      const next = new Set(curr);
      next.delete(key);
      return next;
    });
    this._errors.update(curr => curr.some(e => e.affected?.includes(key))
      ? curr.filter(e => !e.affected?.includes(key))
      : curr);
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

function workloadKey(kubeGuid: string, namespace: string, release: string): string {
  return `workload:${kubeGuid}:${namespace}:${release}`;
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
