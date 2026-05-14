import { Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ListStateStore } from '@stratosui/core';

import { CnsiAuditEventsSource } from '../../../../../services/data-sources/cnsi-audit-events-source';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
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

  private cnsiGuid = '';
  private source?: CnsiAuditEventsSource;

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
  readonly viewMode = this.state.viewMode;
  // basePredicate is ANDed with the text filter inside the predicate
  // built by initialize(). The org / space / app pages set this to
  // restrict the foundation-wide event stream to their entity.
  readonly basePredicate: WritableSignal<(e: StAuditEvent) => boolean> = signal(() => true);

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
    this.cnsiGuid = cnsiGuid;
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
        this.filter.set((ev: StAuditEvent) => {
          if (!base(ev)) return false;
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
    });
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
