import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, inject } from '@angular/core';

import { KubeEndpointDataService } from './kube-endpoint-data.service';

interface RegistryEntry {
  service: KubeEndpointDataService;
  refCount: number;
}

// Per-kubeGuid vending of `KubeEndpointDataService`. Mirrors CF's
// `EndpointDataRegistry` minus the bounded card queue — k8s endpoints
// don't have the same concurrency-budget pressure CF cards have at the
// home-card level (only one foundation is "current" in the kubernetes
// nav at a time). If we discover a real coordination need, the queue
// can be lifted from CF wholesale.
//
// Lifetime model: instances stay sticky after release so re-navigating
// to a previously-loaded endpoint hits a warm cache. Explicit
// `unregister(kubeGuid)` evicts; called by the endpoint-disconnect
// handler in wave-2.

@Injectable({ providedIn: 'root' })
export class KubeEndpointDataRegistry implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly instances = new Map<string, RegistryEntry>();

  // Public counters useful for diagnostics — exposed on
  // `window.__stratosKubeDiag` when running in a browser.
  private _acquireCalls = 0;
  private _acquireExistingHits = 0;
  private _newInstances = 0;
  private _unregisters = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      // Window typing: we attach to a custom field so the global cast
      // is contained to this constructor.
      (window as unknown as { __stratosKubeDiag?: unknown }).__stratosKubeDiag = {
        snapshot: () => this.getSnapshot(),
        registry: this,
      };
    }
  }

  // Returns the cached service for `kubeGuid`, creating a fresh one on
  // first acquire. Always increments the refcount so paired release()
  // calls can decide whether the instance is still in use.
  getService(kubeGuid: string): KubeEndpointDataService {
    return this.acquire(kubeGuid);
  }

  acquire(kubeGuid: string): KubeEndpointDataService {
    this._acquireCalls++;
    const existing = this.instances.get(kubeGuid);
    if (existing) {
      this._acquireExistingHits++;
      existing.refCount++;
      return existing.service;
    }
    // KubeEndpointDataService is a plain class (not @Injectable); we
    // construct it here so DI is bypassed by design.
    const service = new KubeEndpointDataService(this.http, kubeGuid);
    this.instances.set(kubeGuid, { service, refCount: 1 });
    this._newInstances++;
    return service;
  }

  release(kubeGuid: string): void {
    const entry = this.instances.get(kubeGuid);
    if (!entry) return;
    entry.refCount = Math.max(0, entry.refCount - 1);
    // Sticky: instance stays in the map. Use `unregister()` to evict.
  }

  // Drop the service entirely — called when the endpoint disconnects so
  // a future re-connect starts fresh.
  unregister(kubeGuid: string): void {
    if (this.instances.delete(kubeGuid)) {
      this._unregisters++;
    }
  }

  ngOnDestroy(): void {
    this.instances.clear();
  }

  getSnapshot(): {
    acquireCalls: number;
    acquireExistingHits: number;
    newInstances: number;
    unregisters: number;
    instances: Array<{
      kubeGuid: string;
      refCount: number;
      lastFetched: string | null;
      namespaceCount: number;
      nodeCount: number;
      kubeVersion: string | null;
    }>;
  } {
    return {
      acquireCalls: this._acquireCalls,
      acquireExistingHits: this._acquireExistingHits,
      newInstances: this._newInstances,
      unregisters: this._unregisters,
      instances: Array.from(this.instances.entries()).map(([kubeGuid, entry]) => ({
        kubeGuid,
        refCount: entry.refCount,
        lastFetched: entry.service.lastFetched()?.toISOString() ?? null,
        namespaceCount: entry.service.namespaces().length,
        nodeCount: entry.service.nodeCount(),
        kubeVersion: entry.service.kubeVersion(),
      })),
    };
  }
}
