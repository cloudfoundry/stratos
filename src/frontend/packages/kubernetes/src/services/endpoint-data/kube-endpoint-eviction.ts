import { Injectable, WritableSignal } from '@angular/core';

// Root fan-out for "this kubernetes endpoint is gone". The root domain
// caches (pods, nodes, services, generic resources, analysis, helm) keep
// data fetched with the endpoint's credentials for the whole session, so
// each one registers an evictor here and KubeEndpointRegistryHook calls
// evict(kubeGuid) on disconnect or unregister. Services register on
// construction; one never constructed holds nothing to evict.

@Injectable({ providedIn: 'root' })
export class KubeEndpointEviction {
  private readonly evictors: Array<(kubeGuid: string) => void> = [];

  register(evictor: (kubeGuid: string) => void): void {
    this.evictors.push(evictor);
  }

  evict(kubeGuid: string): void {
    this.evictors.forEach(evictor => evictor(kubeGuid));
  }
}

// Drop the keys `owned` matches from a signal-held cache map. Leaves the
// signal untouched when nothing matches, so readers do not recompute.
export function evictKeys<V>(cache: WritableSignal<Map<string, V>>, owned: (key: string) => boolean): void {
  cache.update(curr => {
    const keys = [...curr.keys()].filter(owned);
    if (!keys.length) return curr;
    const next = new Map(curr);
    keys.forEach(key => next.delete(key));
    return next;
  });
}
