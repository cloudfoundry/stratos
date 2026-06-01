import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ListStateStore } from '@stratosui/core';

import { RevisionsService } from '../../services/revisions.service';
import type { RevisionRow } from '../../services/revisions.service';
import { ViewPipeline, SortSpec } from '../../../services/data-sources/view-pipeline';

// Revisions list config — single-app, read-only list. Drives the per-app
// /apps/:cnsi/:app/revisions tab. Revisions represent past deployments; the
// user can roll back to any deployable one. Fetch is cheap (handful of rows),
// so we drain the full response in one call rather than paginating.
@Injectable({ providedIn: 'root' })
export class RevisionsSignalConfigService {
  private readonly revisionsSvc = inject(RevisionsService);
  private readonly injector = inject(Injector);

  private cnsiGuid = '';
  private appGuid = '';

  private readonly state = inject(ListStateStore).bind('cf-app-revisions', {
    viewMode: 'table',
    pageSize: [10, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'version', direction: 'desc' },
      { field: 'version', direction: 'desc' },
    ],
  });

  readonly filter: WritableSignal<(r: RevisionRow) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<RevisionRow>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  private readonly _revisions: WritableSignal<RevisionRow[]> = signal([]);
  readonly revisions: Signal<RevisionRow[]> = this._revisions.asReadonly();

  private readonly _hasLoadedOnce: WritableSignal<boolean> = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  private readonly _featureEnabled: WritableSignal<boolean> = signal(true);
  readonly featureEnabled: Signal<boolean> = this._featureEnabled.asReadonly();

  private readonly _deployedUnknown: WritableSignal<boolean> = signal(false);
  readonly deployedUnknown: Signal<boolean> = this._deployedUnknown.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: RevisionRow) => unknown>> = signal(new Map());

  view!: ViewPipeline<RevisionRow>;

  initialize(cnsiGuid: string, appGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.appGuid = appGuid;

    this.view = new ViewPipeline<RevisionRow>(
      this.revisions,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((r: RevisionRow) => {
          if (!q) return true;
          return (r.description ?? '').toLowerCase().includes(q) ||
            String(r.version).includes(q);
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.cnsiGuid || !this.appGuid) return;
    const resp = await firstValueFrom(
      this.revisionsSvc.listRevisions(this.cnsiGuid, this.appGuid),
    );
    this._revisions.set(resp.revisions ?? []);
    this._featureEnabled.set(resp.featureEnabled ?? true);
    this._deployedUnknown.set(resp.partial?.deployedUnknown ?? false);
    this._hasLoadedOnce.set(true);
  }

  async refresh(): Promise<void> {
    await this.loadAll();
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'version', direction: 'desc' });
    this.pageIndex.set(0);
  }
}
