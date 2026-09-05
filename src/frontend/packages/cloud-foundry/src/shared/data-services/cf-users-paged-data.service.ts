import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { drainCfPages } from '../../services/endpoint-data/drain-pages';
import { StUser, StUserOrgRole, StUserSpaceRole } from '../../services/endpoint-data/stratos-types';

interface CfUsersCnsiState {
  allUsers: WritableSignal<StUser[]>;
  count: WritableSignal<number>;
  isLoading: WritableSignal<boolean>;
  lastFetched: WritableSignal<Date | null>;
  stale: WritableSignal<boolean>;
  inFlight: Observable<void> | null;
}

// Signal-native, per-CNSI source of truth for CF users. Drains the
// server-paged native endpoint into an in-memory StUser[] (shared
// drainCfPages helper), and exposes signals + Observable
// bridges for the read-only list pages and the role/remove/invite wizards.
// Replaces the ngrx pagination path that lived in CfUserService.
@Injectable({ providedIn: 'root' })
export class CfUsersPagedDataService {
  private readonly http = inject(HttpClient);
  private readonly states = new Map<string, CfUsersCnsiState>();
  private readonly _errorsByCnsi = signal<Map<string, unknown>>(new Map());

  readonly errorsByCnsi: Signal<(cnsi: string) => unknown> =
    signal((cnsi: string) => this._errorsByCnsi().get(cnsi)).asReadonly();

  private ensure(cnsi: string): CfUsersCnsiState {
    let s = this.states.get(cnsi);
    if (!s) {
      s = {
        allUsers: signal<StUser[]>([]),
        count: signal(0),
        isLoading: signal(false),
        lastFetched: signal<Date | null>(null),
        stale: signal(false),
        inFlight: null,
      };
      this.states.set(cnsi, s);
    }
    return s;
  }

  usersSignal(cnsi: string): Signal<StUser[]> { return this.ensure(cnsi).allUsers.asReadonly(); }
  count(cnsi: string): Signal<number> { return this.ensure(cnsi).count.asReadonly(); }
  isLoading(cnsi: string): Signal<boolean> { return this.ensure(cnsi).isLoading.asReadonly(); }
  lastFetched(cnsi: string): Signal<Date | null> { return this.ensure(cnsi).lastFetched.asReadonly(); }

  markStale(cnsi: string): void { this.ensure(cnsi).stale.set(true); }

  // Insert a user the cache has never seen (a set-by-username add: the
  // real guid only arrives in the role-change response). Mounted lists
  // pick the new member up without a refetch; callers still markStale so
  // the next full load reconciles with server truth. No-op on a known guid.
  upsertUser(cnsi: string, user: StUser): void {
    const s = this.states.get(cnsi);
    if (!s || s.allUsers().some(u => u.guid === user.guid)) { return; }
    s.allUsers.update(users => [...users, user]);
    s.count.update(n => n + 1);
  }

  // Inline-patch a cached user's role buckets after a role mutation — the
  // signal-native equivalent of the legacy cfUserReducer ADD/REMOVE_CF_ROLE
  // update. Mounted user lists and cache-first reads (getUser seeds the
  // Manage Roles wizard baseline) reflect the change immediately; callers
  // still markStale so the next full load reconciles with server truth.
  // `role` is the prefix-stripped V3 name (e.g. 'manager', 'billing_manager',
  // 'developer') matching the StUser bucket vocabulary.
  applyRoleChange(cnsi: string, userGuid: string, orgGuid: string, spaceGuid: string | undefined, role: string, add: boolean): void {
    const s = this.states.get(cnsi);
    if (!s) { return; }
    s.allUsers.update(users => users.map(u => (u.guid === userGuid ? patchUserRoles(u, orgGuid, spaceGuid, role, add) : u)));
  }

  loadUsers(cnsi: string): Observable<void> {
    const s = this.ensure(cnsi);
    if (!s.stale() && s.lastFetched() !== null && s.allUsers().length > 0) {
      return of(undefined);
    }
    if (s.inFlight) { return s.inFlight; }
    s.isLoading.set(true);
    s.inFlight = drainCfPages<StUser>(this.http, `/pp/v1/cf/users/${cnsi}`).pipe(
      // Freshness stamp + stale-clear on the success path only — a failed
      // drain leaves the cache cold so the next read retries instead of
      // serving the failure as fresh.
      tap(resp => {
        s.allUsers.set(resp.resources);
        s.count.set(resp.totalResults);
        s.lastFetched.set(new Date());
        s.stale.set(false);
        this.clearError(cnsi);
      }),
      map(() => undefined as void),
      catchError(err => { this.setError(cnsi, err); return of(undefined as void); }),
      finalize(() => {
        s.isLoading.set(false);
        s.inFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return s.inFlight;
  }

  refresh(cnsi: string): Observable<void> { this.markStale(cnsi); return this.loadUsers(cnsi); }

  // Observable bridge for legacy-style consumers (cf-roles, confirm):
  // triggers a load then emits the (filtered) users.
  getUsers(cnsi: string): Observable<StUser[]> {
    return this.loadUsers(cnsi).pipe(map(() => this.ensure(cnsi).allUsers()));
  }

  getUser(cnsi: string, guid: string): Observable<StUser | undefined> {
    const cached = this.ensure(cnsi).allUsers().find(u => u.guid === guid);
    if (cached) { return of(cached); }
    return this.http.get<StUser>(`/pp/v1/cf/users/${cnsi}/${guid}`);
  }

  private setError(cnsi: string, err: unknown): void {
    this._errorsByCnsi.update(m => { const n = new Map(m); n.set(cnsi, err); return n; });
  }
  private clearError(cnsi: string): void {
    this._errorsByCnsi.update(m => { if (!m.has(cnsi)) { return m; } const n = new Map(m); n.delete(cnsi); return n; });
  }

}

function patchUserRoles(user: StUser, orgGuid: string, spaceGuid: string | undefined, role: string, add: boolean): StUser {
  if (spaceGuid) {
    return { ...user, spaceRoles: patchSpaceBuckets(user.spaceRoles, orgGuid, spaceGuid, role, add) };
  }
  return { ...user, orgRoles: patchOrgBuckets(user.orgRoles, orgGuid, role, add) };
}

function patchOrgBuckets(buckets: StUserOrgRole[], orgGuid: string, role: string, add: boolean): StUserOrgRole[] {
  const existing = buckets.find(b => b.orgGuid === orgGuid);
  if (add) {
    if (!existing) { return [...buckets, { orgGuid, roles: [role] }]; }
    if (existing.roles.includes(role)) { return buckets; }
    return buckets.map(b => (b === existing ? { ...b, roles: [...b.roles, role] } : b));
  }
  if (!existing || !existing.roles.includes(role)) { return buckets; }
  const roles = existing.roles.filter(r => r !== role);
  return roles.length
    ? buckets.map(b => (b === existing ? { ...b, roles } : b))
    : buckets.filter(b => b !== existing);
}

function patchSpaceBuckets(buckets: StUserSpaceRole[], orgGuid: string, spaceGuid: string, role: string, add: boolean): StUserSpaceRole[] {
  const existing = buckets.find(b => b.spaceGuid === spaceGuid);
  if (add) {
    if (!existing) { return [...buckets, { orgGuid, spaceGuid, roles: [role] }]; }
    if (existing.roles.includes(role)) { return buckets; }
    return buckets.map(b => (b === existing ? { ...b, roles: [...b.roles, role] } : b));
  }
  if (!existing || !existing.roles.includes(role)) { return buckets; }
  const roles = existing.roles.filter(r => r !== role);
  return roles.length
    ? buckets.map(b => (b === existing ? { ...b, roles } : b))
    : buckets.filter(b => b !== existing);
}
