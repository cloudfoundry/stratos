import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import type { SignalListDropdownOption } from '@stratosui/core';
import { ListStateStore } from '@stratosui/core';

import { CnsiAuditEventsSource } from '../../../../../services/data-sources/cnsi-audit-events-source';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import { EndpointDataRegistry } from '../../../../../services/endpoint-data/endpoint-data.registry';
import type { EndpointDataService } from '../../../../../services/endpoint-data/endpoint-data.service';
import type { StAuditEvent } from '../../../../../services/endpoint-data/stratos-types';

// CF Audit Events list config — single-CNSI, read-only. Drives four
// page consumers — the foundation-wide CF Events tab plus the org /
// space / app event tabs — all sharing this single service through
// `basePredicate`. Events default to newest-first sort. nameFilter
// matches against type / actorName / targetName so the user can search
// "alice", "audit.app.create", or an app name uniformly.
@Injectable({ providedIn: 'root' })
export class CfAuditEventsSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  private readonly registry = inject(EndpointDataRegistry);
  private readonly destroyRef = inject(DestroyRef, { optional: true });

  private cnsiGuid = '';
  private source?: CnsiAuditEventsSource;
  private endpointDataService?: EndpointDataService;
  private _destroyHookRegistered = false;

  private readonly state = inject(ListStateStore).bind('cf-audit-events', {
    viewMode: 'table',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'createdAt', direction: 'desc' }, { field: 'createdAt', direction: 'desc' }],
  });

  readonly filter: WritableSignal<(e: StAuditEvent) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StAuditEvent>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  // Toolbar Org / Space narrowing on the CF-level Events page. The
  // org / space / app sub-pages pin basePredicate instead and elect not
  // to render these dropdowns. Selecting an org constrains the Space
  // dropdown to that org's spaces (cascade rule).
  readonly selectedOrg: WritableSignal<string | null> = signal(null);
  readonly selectedSpace: WritableSignal<string | null> = signal(null);
  readonly viewMode = this.state.viewMode;
  // basePredicate is ANDed with the text filter inside the predicate
  // built by initialize(). The org / space / app pages set this to
  // restrict the foundation-wide event stream to their entity.
  readonly basePredicate: WritableSignal<(e: StAuditEvent) => boolean> = signal(() => true);

  // Org options for the toolbar. Sourced from EDS.orgs(); "All"
  // prepended. Natural-sort (numeric-aware). Sub-pages (per-org, per-
  // space, per-app) ignore this dropdown.
  readonly orgOptions: Signal<SignalListDropdownOption[]> = computed(() => {
    const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
    const orgs = this.endpointDataService?.orgs() ?? [];
    const sorted = [...orgs].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    for (const o of sorted) opts.push({ label: o.name, value: o.guid });
    return opts;
  });

  // Space options — cascade-aware.
  // - Org selected: list spaces in that org, label = space name.
  // - Org = All: list every space, label = "<space> - <org>", sorted by
  //   space name then org name (both natural-sort).
  readonly spaceOptions: Signal<SignalListDropdownOption[]> = computed(() => {
    const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
    const spaces = this.endpointDataService?.spaces() ?? [];
    const org = this.selectedOrg();
    if (org) {
      const sorted = spaces
        .filter(s => s.orgGuid === org)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      for (const s of sorted) opts.push({ label: s.name, value: s.guid });
      return opts;
    }
    const orgNameByGuid = new Map((this.endpointDataService?.orgs() ?? []).map(o => [o.guid, o.name]));
    const augmented = spaces.map(s => ({
      guid: s.guid,
      spaceName: s.name,
      orgName: orgNameByGuid.get(s.orgGuid) ?? '',
    }));
    augmented.sort((a, b) => {
      const bySpace = a.spaceName.localeCompare(b.spaceName, undefined, { numeric: true });
      if (bySpace !== 0) return bySpace;
      return a.orgName.localeCompare(b.orgName, undefined, { numeric: true });
    });
    for (const s of augmented) opts.push({ label: `${s.spaceName} - ${s.orgName}`, value: s.guid });
    return opts;
  });

  // Surface the underlying EDS so a consuming component can wait for
  // orgs() / spaces() to populate before rendering the dropdowns. Kept
  // narrow — registry access stays inside the service.
  get endpointData(): EndpointDataService | undefined {
    return this.endpointDataService;
  }

  // Mirror source.items() directly so the UI re-renders incrementally as
  // pages drain in. Audit events on a busy CF can span 50+ pages of 100;
  // awaiting full drain before paint left the page in "Loading…" for
  // 30-60s. Reading the source signal lets the first page render
  // immediately and subsequent pages append as they arrive.
  readonly auditEvents: Signal<StAuditEvent[]> = computed(() =>
    this.source ? this.source.items() : [],
  );

  // Page is "loaded" once page 1 is in. The background drain keeps adding
  // events to the list afterward; the spinner should not block on the
  // full sweep.
  readonly hasLoadedOnce: Signal<boolean> = computed(() =>
    !!this.source && this.source.fetchedPages() >= 1,
  );

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StAuditEvent) => unknown>> = signal(new Map());

  view!: ViewPipeline<StAuditEvent>;

  initialize(cnsiGuid: string): void {
    // Swap CNSI: release the previous EDS handle if a re-initialize() in
    // the same singleton swapped foundations. Refcount-balanced —
    // acquire below pairs with release here or in the destroy hook.
    if (this.endpointDataService && this.cnsiGuid && this.cnsiGuid !== cnsiGuid) {
      this.registry.release(this.cnsiGuid);
      this.endpointDataService = undefined;
    }
    this.cnsiGuid = cnsiGuid;
    if (!this.endpointDataService) {
      this.endpointDataService = this.registry.acquire(cnsiGuid);
    }
    // Kick off the endpoint-data load so orgs() / spaces() populate for
    // the toolbar dropdowns. Errors are swallowed — empty dropdowns are
    // better than a blocked page if loadDetails fails.
    void firstValueFrom(this.endpointDataService.loadDetails()).catch((): void => undefined);
    this.source = new CnsiAuditEventsSource(cnsiGuid, this.http);
    this.view = new ViewPipeline<StAuditEvent>(
      this.auditEvents,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        const base = this.basePredicate();
        const org = this.selectedOrg();
        const space = this.selectedSpace();
        this.filter.set((ev: StAuditEvent) => {
          if (!base(ev)) return false;
          if (org && ev.organizationGuid !== org) return false;
          if (space && ev.spaceGuid !== space) return false;
          if (!q) return true;
          // Search across type / actorName / targetName uniformly so
          // the user can find events by any human-readable hook.
          return (
            (ev.type ?? '').toLowerCase().includes(q) ||
            (ev.actorName ?? '').toLowerCase().includes(q) ||
            (ev.targetName ?? '').toLowerCase().includes(q)
          );
        });
      });
      // Cascade rule: clear stale Space only when Org switches to a
      // different specific org. When Org returns to All, the Space
      // dropdown shows every space (labelled "<space> - <org>"), so the
      // current selection remains valid and must be preserved.
      effect(() => {
        const org = this.selectedOrg();
        const space = this.selectedSpace();
        if (!space) return;
        if (org === null) return;
        const spaces = this.endpointDataService?.spaces() ?? [];
        const match = spaces.find(s => s.guid === space);
        if (!match || match.orgGuid !== org) {
          this.selectedSpace.set(null);
        }
      });
    });

    if (!this._destroyHookRegistered && this.destroyRef) {
      this._destroyHookRegistered = true;
      this.destroyRef.onDestroy(() => {
        if (this.endpointDataService && this.cnsiGuid) {
          this.registry.release(this.cnsiGuid);
          this.endpointDataService = undefined;
        }
      });
    }
  }

  // Fire-and-forget: source emits items incrementally per page, so the
  // template re-renders via the computed mirror as each page arrives.
  // Awaiting here would re-introduce the long-blocking "Loading…" gate
  // on busy CFs.
  loadAll(): Promise<void> {
    if (!this.source) return Promise.resolve();
    return this.source.load();
  }

  refresh(): Promise<void> {
    if (!this.source) return Promise.resolve();
    return this.source.refresh();
  }

  // Default sort is newest-first; clearing returns there.
  clearFilters(): void {
    this.nameFilter.set('');
    this.selectedOrg.set(null);
    this.selectedSpace.set(null);
    this.sort.set({ field: 'createdAt', direction: 'desc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StAuditEvent) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
