import { Injectable, Signal, inject, signal } from '@angular/core';
import { EndpointDisconnectCleanupService } from '@stratosui/store';
import { Observable } from 'rxjs';

/** The parts of a snackbar ref that banner tracking needs. */
export interface EndpointBannerRef {
  dismiss(): void;
  afterDismissed(): Observable<unknown>;
}

/**
 * Tracks per-endpoint client-side auth-state hints surfaced from the proxy
 * layer. Today the only hint is "stale" — the endpoint's stored token is
 * being rejected by CAPI (502 InvalidAuthToken / token-refresh-failed) and
 * the user needs to reconnect.
 *
 * Also owns the re-auth banners raised for an endpoint (trackBanner), so a
 * banner goes away once its endpoint works again.
 *
 * Keeps its own state rather than living in the endpoint store, so the HTTP
 * interceptor can inject it. It reaches the store only through the cleanup
 * service's connect events, registered at construction; the store never
 * injects this service, so there is no injection cycle.
 */
@Injectable({ providedIn: 'root' })
export class EndpointAuthStateService {
  private readonly _stale = signal<ReadonlySet<string>>(new Set<string>());
  readonly stale: Signal<ReadonlySet<string>> = this._stale.asReadonly();

  // Open re-auth banners and the endpoints each one still speaks for.
  private readonly banners = new Map<EndpointBannerRef, Set<string>>();

  constructor() {
    // A successful connect replaces the rejected token: the endpoint is no
    // longer stale and its banners are out of date.
    inject(EndpointDisconnectCleanupService).registerConnectHandler(event => this.clearStale(event.guid));
  }

  /**
   * Record a banner raised for these endpoints. clearStale closes it once
   * every one of them has cleared; a banner the user dismisses is dropped.
   */
  trackBanner(guids: readonly string[], ref: EndpointBannerRef): void {
    this.banners.set(ref, new Set(guids));
    ref.afterDismissed().subscribe(() => this.banners.delete(ref));
  }

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
   * Clear the stale mark for an endpoint — called on a successful connect
   * (the cleanup service's connect event) and by the CF interceptor on any
   * 2xx CAPI response from that endpoint. Also clears any one-shot notify
   * records for the endpoint so a later failure re-notifies, and closes the
   * banners that no longer speak for any uncleared endpoint.
   */
  clearStale(guid: string): void {
    for (const [ref, guids] of [...this.banners]) {
      if (guids.delete(guid) && guids.size === 0) {
        this.banners.delete(ref);
        ref.dismiss();
      }
    }
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
