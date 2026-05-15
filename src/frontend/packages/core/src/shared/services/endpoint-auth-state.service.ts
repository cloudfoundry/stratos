import { Injectable, Signal, signal } from '@angular/core';

/**
 * Tracks per-endpoint client-side auth-state hints surfaced from the proxy
 * layer. Today the only hint is "stale" — the endpoint's stored token is
 * being rejected by CAPI (502 InvalidAuthToken / token-refresh-failed) and
 * the user needs to reconnect.
 *
 * Lives independently of the endpoint entity store so it can be wired from
 * an HTTP interceptor without any circular-dep risk against the heavier
 * EndpointsDataService.
 */
@Injectable({ providedIn: 'root' })
export class EndpointAuthStateService {
  private readonly _stale = signal<ReadonlySet<string>>(new Set<string>());
  readonly stale: Signal<ReadonlySet<string>> = this._stale.asReadonly();

  /**
   * Mark an endpoint as needing reconnect. Returns true if this is a new
   * mark (so callers can debounce side-effects like toasts to fire only
   * on the first observation).
   */
  markStale(guid: string): boolean {
    const current = this._stale();
    if (current.has(guid)) {
      return false;
    }
    const next = new Set(current);
    next.add(guid);
    this._stale.set(next);
    return true;
  }

  /**
   * Clear the stale mark for an endpoint — called on successful reconnect
   * or any subsequent 2xx CAPI response from that endpoint.
   */
  clearStale(guid: string): void {
    const current = this._stale();
    if (!current.has(guid)) {
      return;
    }
    const next = new Set(current);
    next.delete(guid);
    this._stale.set(next);
  }

  isStale(guid: string): boolean {
    return this._stale().has(guid);
  }
}
