import { Injectable, WritableSignal, signal, untracked } from '@angular/core';

import { StratosError } from './kube-types';

// Root fan-out for "this kubernetes endpoint is gone". The root domain
// caches (pods, nodes, services, generic resources, analysis, helm) keep
// data fetched with the endpoint's credentials for the whole session, so
// each one registers an evictor here and KubeEndpointRegistryHook calls
// evict(kubeGuid) on disconnect or unregister. Services register on
// construction; one never constructed holds nothing to evict.
//
// Eviction cannot recall a request already on the wire, so each evict
// also bumps the guid's epoch. A load takes current(kubeGuid) before it
// sends and writes its response only while that check still holds.

@Injectable({ providedIn: 'root' })
export class KubeEndpointEviction {
  private readonly evictors: Array<(kubeGuid: string) => void> = [];
  private readonly epochs = signal<ReadonlyMap<string, number>>(new Map());

  register(evictor: (kubeGuid: string) => void): void {
    this.evictors.push(evictor);
  }

  evict(kubeGuid: string): void {
    this.epochs.update(curr => new Map(curr).set(kubeGuid, (curr.get(kubeGuid) ?? 0) + 1));
    this.evictors.forEach(evictor => evictor(kubeGuid));
  }

  // Tracked read: a computed that calls this re-runs after each evict of
  // the guid (used to re-resolve per-endpoint instances).
  epoch(kubeGuid: string): number {
    return this.epochs().get(kubeGuid) ?? 0;
  }

  // Check that stays true until the next evict(kubeGuid). Untracked, so a
  // load started from inside a computed adds no dependency.
  current(kubeGuid: string): () => boolean {
    const at = untracked(() => this.epoch(kubeGuid));
    return () => untracked(() => this.epoch(kubeGuid)) === at;
  }

  // current() for a load that learns its guids only from the response:
  // the check holds for each guid not evicted since this call.
  currentAny(): (kubeGuid: string) => boolean {
    const at = untracked(this.epochs);
    return kubeGuid => (untracked(this.epochs).get(kubeGuid) ?? 0) === (at.get(kubeGuid) ?? 0);
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

// Drop the errors whose `affected` entries all belong to the departed
// endpoint (an error naming another endpoint too stays). `owned` defaults
// to the guid itself; caches that also tag a scope key pass their own.
export function evictErrors(
  errors: WritableSignal<StratosError[]>,
  kubeGuid: string,
  owned: (affected: string) => boolean = a => a === kubeGuid,
): void {
  errors.update(curr => {
    const next = curr.filter(e => !(e.affected?.length && e.affected.every(owned)));
    return next.length === curr.length ? curr : next;
  });
}
