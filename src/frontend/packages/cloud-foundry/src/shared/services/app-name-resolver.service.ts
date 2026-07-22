import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { StApp, StAppsResponse } from '../../services/endpoint-data/stratos-types';

/**
 * AppNameResolverService
 *
 * Slice-3 framework primitive: maps (cnsi, appGuid) → app name through a
 * batch-coalesced, signal-backed cache. Structural analog of slice-2's
 * `removeRow` mutation hook on the orchestrator — a small, reusable
 * shape that any signal-native page can lean on.
 *
 * First consumer is the Routes tab's Apps-Attached column. Unlike
 * `StRoute.URL` (server-composed by CF), the names of apps mapped to a
 * route are not on the route envelope; the column needs a guid-batch
 * lookup. Mirrors the org/space resolver overlay shape inside
 * `CfAppsSignalConfigService` (`resolveOrgs` / `resolveSpaces`) but
 * exposed as a standalone service so non-app-wall pages can consume it.
 *
 * Wire:
 *   GET /pp/v1/cf/apps/{cnsi}?guids=g1,g2,...
 * The Stratos-native handler skips enrichment for guid-batch reads and
 * returns a `StAppsResponse` whose `resources` carry at least guid +
 * name + spaceGuid.
 *
 * Behaviors:
 *  - **Cache hit** is synchronous: subsequent `resolve(cnsi, g)` returns
 *    the cached name on the next microtask (the returned Signal updates
 *    when the cache map is replaced).
 *  - **Batch coalescing**: distinct guids requested in the same
 *    microtask are coalesced into ONE `?guids=...` request per cnsi.
 *  - **In-flight dedup**: re-requesting a guid whose request is still
 *    pending shares the same promise, no second network call.
 *  - **Multi-cnsi isolation**: same guid in two cnsis is two cache
 *    slots, two requests.
 *  - **Partial bulk**: `resolveMany` only fetches the misses.
 */
@Injectable({ providedIn: 'root' })
export class AppNameResolverService {
  private http = inject(HttpClient);

  // Per-CNSI name cache. WritableSignal so consumers reading via
  // computed() re-evaluate when a batch lands and a new map is published.
  // Replace-on-write (not mutate-in-place) so the signal change tick fires.
  private readonly _namesByCnsi: WritableSignal<Map<string, Map<string, string>>> =
    signal(new Map());

  // Per-(cnsi, guid) in-flight promise. Both `resolve` and `resolveMany`
  // funnel through `getOrFetch` which checks this map, so two concurrent
  // calls for the same guid wait on the SAME promise — no duplicate HTTP.
  private readonly inFlight = new Map<string, Promise<void>>();

  // Microtask-pending requests, bucketed by cnsi. A scheduled flush
  // collapses all guids queued during the current tick into one URL.
  // We don't use rxjs subjects here — a microtask-scoped Set keeps the
  // surface tiny and avoids leaking subscription lifecycle into the
  // primitive.
  private readonly pendingByCnsi = new Map<string, Set<string>>();
  private flushScheduled = false;

  /**
   * Returns a signal that resolves to the cached app name, or `null`
   * until the batch lands. Safe to call repeatedly — repeated calls
   * for the same guid before resolution share the in-flight promise.
   */
  resolve(cnsi: string, appGuid: string): Signal<string | null> {
    if (!this.cacheGet(cnsi, appGuid) && !this.inFlight.has(this.key(cnsi, appGuid))) {
      this.queue(cnsi, [appGuid]);
    }
    return computed(() => this.cacheGet(cnsi, appGuid) ?? null);
  }

  /**
   * Bulk variant. Cache hits are read straight from the map; only the
   * uncached guids are queued. The returned signal is a `Map<guid,name>`
   * over the requested guids — entries appear as their fetches land.
   */
  resolveMany(cnsi: string, appGuids: readonly string[]): Signal<Map<string, string>> {
    const misses: string[] = [];
    for (const g of appGuids) {
      if (!this.cacheGet(cnsi, g) && !this.inFlight.has(this.key(cnsi, g))) {
        misses.push(g);
      }
    }
    if (misses.length) this.queue(cnsi, misses);
    return computed(() => {
      const out = new Map<string, string>();
      const inner = this._namesByCnsi().get(cnsi);
      if (!inner) return out;
      for (const g of appGuids) {
        const name = inner.get(g);
        if (name !== undefined) out.set(g, name);
      }
      return out;
    });
  }

  // ---- internals ----------------------------------------------------------

  private key(cnsi: string, guid: string): string {
    return `${cnsi}:${guid}`;
  }

  private cacheGet(cnsi: string, guid: string): string | undefined {
    return this._namesByCnsi().get(cnsi)?.get(guid);
  }

  private queue(cnsi: string, guids: readonly string[]): void {
    let bucket = this.pendingByCnsi.get(cnsi);
    if (!bucket) {
      bucket = new Set<string>();
      this.pendingByCnsi.set(cnsi, bucket);
    }
    for (const g of guids) bucket.add(g);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    // queueMicrotask collapses every queue() call within the current
    // synchronous tick into a single fetch per cnsi — the batch-coalesce
    // contract. Promise.resolve().then would do too; queueMicrotask is
    // explicit about intent and avoids creating an unused Promise chain.
    queueMicrotask(() => this.flush());
  }

  private flush(): void {
    this.flushScheduled = false;
    const buckets = Array.from(this.pendingByCnsi.entries());
    this.pendingByCnsi.clear();
    for (const [cnsi, set] of buckets) {
      // Filter out anything that's been satisfied or is already in flight
      // (a parallel flush() race could happen if a future caller calls
      // queue() inside another microtask before this one runs).
      const guids: string[] = [];
      for (const g of set) {
        if (this.cacheGet(cnsi, g)) continue;
        if (this.inFlight.has(this.key(cnsi, g))) continue;
        guids.push(g);
      }
      if (!guids.length) continue;
      const promise = this.fetchBatch(cnsi, guids);
      for (const g of guids) this.inFlight.set(this.key(cnsi, g), promise);
    }
  }

  private async fetchBatch(cnsi: string, guids: string[]): Promise<void> {
    const url = `/pp/v1/cf/apps/${cnsi}?guids=${guids.join(',')}&per_page=${guids.length}`;
    try {
      const resp = await firstValueFrom(this.http.get<StAppsResponse>(url))
        .catch((): StAppsResponse | null => null);
      const resources = (resp?.resources ?? []) as StApp[];
      if (resources.length) {
        this._namesByCnsi.update(curr => {
          const next = new Map(curr);
          const inner = new Map(next.get(cnsi) ?? []);
          for (const a of resources) {
            if (a.guid && a.name) inner.set(a.guid, a.name);
          }
          next.set(cnsi, inner);
          return next;
        });
      }
    } finally {
      // Drop in-flight markers regardless of success — a failed batch
      // won't be auto-retried on its own (nothing schedules it). The
      // next caller that asks for an unresolved guid re-queues it.
      for (const g of guids) this.inFlight.delete(this.key(cnsi, g));
    }
  }
}
