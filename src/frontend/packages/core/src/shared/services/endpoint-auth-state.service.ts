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

  // Per-endpoint one-shot dedup for non-auth error banners (unreachable /
  // generic). Keyed by `${guid}:${reason}` so a different failure reason for
  // the same endpoint can still surface once. Distinct from `_stale`, which
  // specifically means "needs reconnect" — an unreachable endpoint is down,
  // not auth-stale, so it must not enter the stale set.
  private readonly _notified = signal<ReadonlySet<string>>(new Set<string>());

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
   * Record that a banner has been shown for (guid, reason) and return true
   * only on the first observation, so the interceptor fires non-auth error
   * banners (unreachable / generic) once per endpoint+reason rather than on
   * every failed request. Cleared by clearStale on the next 2xx.
   */
  notifyOnce(guid: string, reason: string): boolean {
    const key = `${guid}:${reason}`;
    const current = this._notified();
    if (current.has(key)) {
      return false;
    }
    const next = new Set(current);
    next.add(key);
    this._notified.set(next);
    return true;
  }

  /**
   * Clear the stale mark for an endpoint — called on successful reconnect
   * or any subsequent 2xx CAPI response from that endpoint. Also clears any
   * one-shot notify records for the endpoint so a later failure re-notifies.
   */
  clearStale(guid: string): void {
    const current = this._stale();
    if (current.has(guid)) {
      const next = new Set(current);
      next.delete(guid);
      this._stale.set(next);
    }

    const notified = this._notified();
    const prefix = `${guid}:`;
    let changed = false;
    const nextNotified = new Set(notified);
    for (const key of notified) {
      if (key.startsWith(prefix)) {
        nextNotified.delete(key);
        changed = true;
      }
    }
    if (changed) {
      this._notified.set(nextNotified);
    }
  }

  isStale(guid: string): boolean {
    return this._stale().has(guid);
  }
}
