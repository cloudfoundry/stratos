import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { StUser, StUsersResponse } from './stratos-types';

// Per-CNSI lazy snapshot of the V3-native users + roles join (the
// `/pp/v1/cf/users/:cnsi` envelope returned by getNativeUsers).
//
// Kept deliberately separate from EndpointDataService: the home-page
// parallelization cache covers orgs + apps + spaces only, since users +
// roles are heavier to compose and most home-card consumers never need
// them. This service is opt-in — Summary tiles that surface User Org
// Role / Users count read through it; the home page does not pay for the
// fetch.
//
// Fetch is fire-and-forget on first read of users(): a writable signal
// is seeded with `null` (loading sentinel), the fetch promise populates
// it with an array. Consumers branch on null to render placeholder
// dashes instead of a flickering "0" before the response lands.
// In-flight de-dupe keeps concurrent reads from issuing the same
// request twice.
@Injectable({ providedIn: 'root' })
export class CnsiUsersSnapshotService {
  private readonly http = inject(HttpClient);

  private readonly snapshots = new Map<string, WritableSignal<StUser[] | null>>();
  private readonly inflight = new Map<string, Promise<void>>();

  users(cnsiGuid: string): Signal<StUser[] | null> {
    const existing = this.snapshots.get(cnsiGuid);
    if (existing) return existing.asReadonly();
    const sig = signal<StUser[] | null>(null);
    this.snapshots.set(cnsiGuid, sig);
    void this.fetch(cnsiGuid);
    return sig.asReadonly();
  }

  async refresh(cnsiGuid: string): Promise<void> {
    if (!this.snapshots.has(cnsiGuid)) {
      this.snapshots.set(cnsiGuid, signal<StUser[] | null>(null));
    }
    return this.fetch(cnsiGuid);
  }

  // Re-fetch only when a snapshot was already taken. Mutation flows (role
  // changes, invites) call this so Summary tiles don't go stale, without
  // paying for the users+roles join on endpoints where no tile ever
  // rendered.
  refreshIfLoaded(cnsiGuid: string): void {
    if (this.snapshots.has(cnsiGuid)) {
      void this.fetch(cnsiGuid);
    }
  }

  private fetch(cnsiGuid: string): Promise<void> {
    const existing = this.inflight.get(cnsiGuid);
    if (existing) return existing;
    const p = firstValueFrom(
      this.http.get<StUsersResponse>(`/pp/v1/cf/users/${cnsiGuid}`),
    )
      .then(resp => {
        this.snapshots.get(cnsiGuid)!.set(resp?.resources ?? []);
      })
      .catch((): void => {
        // Mark as loaded-empty so tiles render 0 / None instead of staying
        // on the loading dash forever after a backend failure.
        this.snapshots.get(cnsiGuid)!.set([]);
      })
      .finally(() => {
        this.inflight.delete(cnsiGuid);
      });
    this.inflight.set(cnsiGuid, p);
    return p;
  }
}
