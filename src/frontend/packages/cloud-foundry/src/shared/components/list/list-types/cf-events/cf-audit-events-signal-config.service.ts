import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

  readonly filter: WritableSignal<(e: StAuditEvent) => boolean> = signal(() => true);
  readonly sort: WritableSignal<SortSpec<StAuditEvent>> = signal({ field: 'createdAt', direction: 'desc' });
  readonly pageSize: WritableSignal<number> = signal(24);
  readonly pageIndex: WritableSignal<number> = signal(0);
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode: WritableSignal<'table' | 'card'> = signal('table');
  // basePredicate is ANDed with the text filter inside the predicate
  // built by initialize(). The org / space / app pages set this to
  // restrict the foundation-wide event stream to their entity.
  readonly basePredicate: WritableSignal<(e: StAuditEvent) => boolean> = signal(() => true);

  private readonly _auditEvents: WritableSignal<StAuditEvent[]> = signal([]);
  readonly auditEvents: Signal<StAuditEvent[]> = this._auditEvents.asReadonly();

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

  async loadAll(): Promise<void> {
    if (!this.source) return;
    await this.source.load();
    this._auditEvents.set([...this.source.items()]);
  }

  async refresh(): Promise<void> {
    if (!this.source) return;
    await this.source.refresh();
    this._auditEvents.set([...this.source.items()]);
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
