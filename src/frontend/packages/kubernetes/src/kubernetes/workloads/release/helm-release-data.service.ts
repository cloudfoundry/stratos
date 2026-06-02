import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { HelmRelease, HelmReleaseGraph, HelmReleaseResources, HelmReleaseRevision } from '../workload.types';

// Signal-native data surface for the single helm-release detail page.
// Replaces the `workloadsEntityCatalog.{release,graph,resource,history}`
// ngrx entity-catalog reads that `HelmReleaseHelperService` consumed via
// `getEntityService`/`getEntityMonitor`.
//
// Keyed by the release guid (`${endpoint}:${namespace}:${name}`) so a page
// instance reads exactly the surfaces the socket service writes for it.
//
//   - Release detail: GET /pp/v1/helm/releases/{endpoint}/{ns}/{name}
//   - Release history: GET /pp/v1/helm/releases/{endpoint}/{ns}/{name}/history
//   - Graph + resources arrive over the helm-release status websocket
//     (see HelmReleaseSocketService) — written via setGraph/setResources.
@Injectable({ providedIn: 'root' })
export class HelmReleaseDataService {
  private readonly http = inject(HttpClient);

  private readonly _detail = new Map<string, WritableSignal<HelmRelease | undefined>>();
  private readonly _detailLoading = new Map<string, WritableSignal<boolean>>();
  private readonly _history = new Map<string, WritableSignal<HelmReleaseRevision[] | undefined>>();
  private readonly _graph = new Map<string, WritableSignal<HelmReleaseGraph | undefined>>();
  private readonly _resources = new Map<string, WritableSignal<HelmReleaseResources | undefined>>();

  private guid(endpoint: string, namespace: string, name: string): string {
    return `${endpoint}:${namespace}:${name}`;
  }

  private sig<T>(map: Map<string, WritableSignal<T>>, key: string, init: T): WritableSignal<T> {
    let s = map.get(key);
    if (!s) {
      s = signal<T>(init);
      map.set(key, s);
    }
    return s;
  }

  // --- Read API (stable signal identity per guid) ---

  releaseDetail(guid: string): Signal<HelmRelease | undefined> {
    return this.sig(this._detail, guid, undefined).asReadonly();
  }

  isFetchingDetail(guid: string): Signal<boolean> {
    return this.sig(this._detailLoading, guid, false).asReadonly();
  }

  history(guid: string): Signal<HelmReleaseRevision[] | undefined> {
    return this.sig(this._history, guid, undefined).asReadonly();
  }

  graph(guid: string): Signal<HelmReleaseGraph | undefined> {
    return this.sig(this._graph, guid, undefined).asReadonly();
  }

  resources(guid: string): Signal<HelmReleaseResources | undefined> {
    return this.sig(this._resources, guid, undefined).asReadonly();
  }

  // --- Socket-fed writes ---

  setGraph(guid: string, graph: HelmReleaseGraph): void {
    this.sig(this._graph, guid, undefined).set(graph);
  }

  setResources(guid: string, resources: HelmReleaseResources): void {
    this.sig(this._resources, guid, undefined).set(resources);
  }

  // --- REST loads ---

  async loadReleaseDetail(endpoint: string, namespace: string, name: string): Promise<void> {
    const key = this.guid(endpoint, namespace, name);
    const loading = this.sig(this._detailLoading, key, false);
    loading.set(true);
    try {
      const resp = await firstValueFrom(
        this.http.get<HelmRelease>(`/pp/v1/helm/releases/${endpoint}/${namespace}/${name}`),
      );
      this.sig(this._detail, key, undefined).set(resp);
    } catch {
      // Leave the detail signal as-is; the page renders the tristate empty.
    } finally {
      loading.set(false);
    }
  }

  async loadHistory(endpoint: string, namespace: string, name: string): Promise<void> {
    const key = this.guid(endpoint, namespace, name);
    try {
      const resp = await firstValueFrom(
        this.http.get<{ revisions?: HelmReleaseRevision[] }>(
          `/pp/v1/helm/releases/${endpoint}/${namespace}/${name}/history`,
        ),
      );
      this.sig(this._history, key, undefined).set(resp?.revisions ?? []);
    } catch {
      // Leave history undefined on error.
    }
  }
}
