import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ListStateStore } from '@stratosui/core';
import { CfUserListDiagnosticsService } from '../../../../../services/diagnostics/cf-user-list-diagnostics.service';
import { EndpointDataRegistry } from '../../../../../services/endpoint-data/endpoint-data.registry';
import type { EndpointDataService } from '../../../../../services/endpoint-data/endpoint-data.service';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StUser, StUsersResponse } from '../../../../../services/endpoint-data/stratos-types';

// Users list config service — single-CNSI, optionally org- or space-scoped.
// Modelled on CfRoutesSignalConfigService (which also fetches its own list
// and supports the optional sub-scope pattern). The CF-level users page,
// the per-org users tab and the per-space users tab all use this one
// service:
//
//   - CF-level page: initialize(cnsiGuid) — empty scope, every user in
//     the CNSI rendered.
//   - Per-org tab: initializeForOrg(cnsiGuid, orgGuid) — narrows the
//     view to users with at least one org role (or any space role under
//     a space owned by the org) in the locked org.
//   - Per-space tab: initializeForSpace(cnsiGuid, spaceGuid) — narrows
//     the view to users with at least one space role in the locked space.
//
// Users are not carried on EndpointDataService (the home-page cache covers
// orgs + apps + spaces; users live separately because the join is heavier).
// This service owns its own fetch against GET /pp/v1/cf/users/:cnsi.
//
// Manage Roles + Remove User flows stay legacy in this round — the service
// has no write methods. The page is read-only signal-native.
@Injectable({ providedIn: 'root' })
export class CfUsersSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly registry = inject(EndpointDataRegistry);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly diag = inject(CfUserListDiagnosticsService);

  private endpointDataService?: EndpointDataService;
  private cnsiGuid = '';
  // Empty string = show all users for the CNSI (the CF-level Users tab).
  // Non-empty = narrow to users with at least one role in that space (the
  // per-space Users tab). Stored in a WritableSignal so the filter effect
  // re-derives the predicate when the lock changes mid-session.
  private readonly _lockedSpaceGuid: WritableSignal<string> = signal('');
  // Empty string = no org scope (CF-level or per-space tabs). Non-empty =
  // narrow to users with at least one org role in the locked org, or a
  // space role under one of the org's spaces. Same signal pattern as the
  // space lock — both feed the users computed below.
  private readonly _lockedOrgGuid: WritableSignal<string> = signal('');

  private readonly state = inject(ListStateStore).bind('cf-users', {
    viewMode: 'table',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'username', direction: 'asc' }, { field: 'username', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(user: StUser) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StUser>>;
  // Users are denser-table-friendly (long usernames + multi-segment role
  // cells), so default to the table mode's first page-size option (25).
  // Matches the legacy ViewType.TABLE_ONLY behaviour.
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Raw user list as returned by the backend for this CNSI. We keep the
  // unfiltered list in the writable signal and project the space-filtered
  // view via a computed — symmetric with how CfRoutesSignalConfigService
  // narrows per-CNSI routes down to one space.
  private readonly _allUsers: WritableSignal<StUser[]> = signal([]);

  readonly users: Signal<StUser[]> = computed(() => {
    const all = this._allUsers();
    const spaceLock = this._lockedSpaceGuid();
    const orgLock = this._lockedOrgGuid();
    if (spaceLock) {
      return all.filter(u => u.spaceRoles.some(sr => sr.spaceGuid === spaceLock));
    }
    if (orgLock) {
      // Either an org role in the target org OR a space role on one of
      // the org's spaces (StUserSpaceRole carries orgGuid alongside
      // spaceGuid for exactly this lookup — no second registry hit).
      return all.filter(u =>
        u.orgRoles.some(or => or.orgGuid === orgLock) ||
        u.spaceRoles.some(sr => sr.orgGuid === orgLock),
      );
    }
    return all;
  });

  view!: ViewPipeline<StUser>;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StUser) => unknown>> = signal(new Map());

  private readonly _hasLoadedOnce = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  // Org/space name lookups, surfaced from EndpointDataService so the
  // CF-level page's Org Roles + Space Roles compound cells can resolve
  // names instead of rendering raw GUIDs (no_raw_guids feedback rule).
  // Built from the same orgs() / spaces() signals the routes config
  // exposes — the home-page parallelization cache populates them as a
  // side-effect of loadDetails() on the CNSI.
  readonly orgNameByGuid: Signal<Map<string, string>> = computed(() => {
    const map = new Map<string, string>();
    const orgs = this.endpointDataService?.orgs() ?? [];
    for (const o of orgs) map.set(o.guid, o.name);
    return map;
  });

  readonly spaceNameByGuid: Signal<Map<string, string>> = computed(() => {
    const map = new Map<string, string>();
    const spaces = this.endpointDataService?.spaces() ?? [];
    for (const s of spaces) map.set(s.guid, s.name);
    return map;
  });

  // Access to the endpoint-data service for components that want to wait on
  // its loadDetails (e.g. to render org/space names before the buckets
  // resolve). Kept narrow — the service hides the registry from callers.
  get endpointData(): EndpointDataService | undefined {
    return this.endpointDataService;
  }

  initialize(cnsiGuid: string): void {
    this.diag.record(cnsiGuid, 'initialize-called', {
      previousCnsiGuid: this.cnsiGuid,
      allUsersLenBefore: this._allUsers().length,
      hasLoadedOnceBefore: this._hasLoadedOnce(),
    });
    this.cnsiGuid = cnsiGuid;
    this._lockedSpaceGuid.set('');
    this._lockedOrgGuid.set('');
    this.endpointDataService = this.registry.acquire(cnsiGuid);
    this.view = new ViewPipeline<StUser>(
      this.users,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
    this.diag.setIdentity(cnsiGuid, '/pp/v1/cf/users', `signal:${cnsiGuid}`, 'CfUsersSignalConfigService');
    this.diag.setDataSource(cnsiGuid, {
      rowCount: () => this.view?.totalFilteredResults() ?? -1,
      allRowsCount: () => this._allUsers().length,
      isLoadingPage: () => !this._hasLoadedOnce(),
    });
    this.diag.record(cnsiGuid, 'view-pipeline-built');
    // Kick off the endpoint-data load so orgs() / spaces() populate; swallow
    // errors since the user list still renders without name lookups (cells
    // fall back to the GUID short-form / em-dash).
    void firstValueFrom(this.endpointDataService.loadDetails()).catch((): void => undefined);
    void this.fetchUsers();
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((u: StUser) => {
          if (!q) return true;
          return (u.username ?? '').toLowerCase().includes(q);
        });
      });
    });
    this.destroyRef.onDestroy(() => {
      this.registry.release(cnsiGuid);
    });
  }

  // Per-space variant. Same machinery as initialize() — only difference is
  // the locked space scope, which the users computed projects through the
  // raw list. Toolbar and column shape stay identical; the per-space page
  // simply chooses to render fewer columns (no Org Roles).
  initializeForSpace(cnsiGuid: string, spaceGuid: string): void {
    this.initialize(cnsiGuid);
    this._lockedSpaceGuid.set(spaceGuid);
    // Nudge the filter so the predicate re-runs against the new lock — the
    // computed already re-derives users, but the ViewPipeline reads filter
    // through a separate signal and the toolbar's name filter alone may
    // not have changed. Setting it to a clone forces the derivation.
    this.filter.set(this.filter());
  }

  // Per-org variant. Mirror of initializeForSpace — pins the org lock so
  // the users computed narrows to users with at least one org role in the
  // target org or any space role under one of the org's spaces. Used by
  // the per-org Users tab; column shape is the per-org reduction
  // (Username, Origin, Org Roles for THIS org, Space Roles in THIS org,
  // Created — no all-CNSI Org Roles column).
  initializeForOrg(cnsiGuid: string, orgGuid: string): void {
    this.initialize(cnsiGuid);
    this._lockedOrgGuid.set(orgGuid);
    // Same filter nudge as initializeForSpace (see comment above).
    this.filter.set(this.filter());
  }

  private async fetchUsers(): Promise<void> {
    const requestedFor = this.cnsiGuid;
    this.diag.record(requestedFor, 'fetch-start');
    try {
      const resp = await firstValueFrom(
        this.http.get<StUsersResponse>(`/pp/v1/cf/users/${requestedFor}`),
      );
      const cnsiAtResolve = this.cnsiGuid;
      this.diag.record(requestedFor, 'fetch-resolved', {
        cnsiAtResolve,
        cnsiAtRequest: requestedFor,
        sameCnsi: cnsiAtResolve === requestedFor,
        respCount: resp?.resources?.length ?? 0,
      });
      this._allUsers.set(resp?.resources ?? []);
      this._hasLoadedOnce.set(true);
      this.diag.record(requestedFor, 'allUsers-set', { len: this._allUsers().length });
    } catch (e) {
      // Swallow — empty state renders instead of a forever-loading
      // spinner. Errors surface via the list's generic error UI if wired
      // through the orchestrator-style errorsByCnsi signal in future.
      this.diag.record(requestedFor, 'fetch-error', { error: (e as Error)?.message });
      this._hasLoadedOnce.set(true);
    }
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'username', direction: 'asc' });
    this.pageIndex.set(0);
  }

  async refresh(): Promise<void> {
    await this.fetchUsers();
    if (this.endpointDataService) {
      try {
        await firstValueFrom(this.endpointDataService.loadDetails());
      } catch {
        // StError surfacing owns user-visible messaging.
      }
    }
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StUser) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
