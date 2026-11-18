import { signal, untracked } from '@angular/core';

// Loads in flight per key (a list's scope), held in a signal so a list
// can show its loading state while its own load is on the wire.
export class KubeLoadTracker {
  private readonly inFlight = signal<ReadonlyMap<string, number>>(new Map());

  // A reactive read: call it inside a computed.
  isLoading(key: string): boolean {
    return (this.inFlight().get(key) ?? 0) > 0;
  }

  // Counts a load as started and returns the call that ends it (safe to
  // call more than once). The writes run untracked because a load can
  // start from a read inside a computed (the pod lists load on read).
  start(key: string): () => void {
    untracked(() => this.bump(key, 1));
    let ended = false;
    return () => {
      if (ended) return;
      ended = true;
      untracked(() => this.bump(key, -1));
    };
  }

  private bump(key: string, by: number): void {
    this.inFlight.update(curr => {
      const next = new Map(curr);
      const count = (next.get(key) ?? 0) + by;
      if (count > 0) {
        next.set(key, count);
      } else {
        next.delete(key);
      }
      return next;
    });
  }
}
