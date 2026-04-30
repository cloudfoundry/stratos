import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ListStateStore } from '@stratosui/core';

import { CnsiBuildpacksSource } from '../../../../../services/data-sources/cnsi-buildpacks-source';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StBuildpack } from '../../../../../services/endpoint-data/stratos-types';

// CF Buildpacks list config — single-CNSI, read-only. Drives the per-CF
// /cloud-foundry/:cnsi/buildpacks tab. Buildpacks are foundation-level
// metadata (staging artifacts pinned to a rootfs); they don't relate to
// orgs / spaces / apps and are typically 10–30 per foundation, so this
// service stays simple: own the fetch, expose a buildpacks() signal, run
// it through ViewPipeline. No writes — buildpack upload/reorder/lock are
// platform-admin operations not surfaced here.
@Injectable({ providedIn: 'root' })
export class CfBuildpacksSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  private cnsiGuid = '';
  private source?: CnsiBuildpacksSource;

  private readonly state = inject(ListStateStore).bind('cf-buildpacks', {
    viewMode: 'card',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'position', direction: 'asc' }, { field: 'position', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(b: StBuildpack) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StBuildpack>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  private readonly _buildpacks: WritableSignal<StBuildpack[]> = signal([]);
  readonly buildpacks: Signal<StBuildpack[]> = this._buildpacks.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StBuildpack) => unknown>> = signal(new Map());

  view!: ViewPipeline<StBuildpack>;

  initialize(cnsiGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.source = new CnsiBuildpacksSource(cnsiGuid, this.http);
    this.view = new ViewPipeline<StBuildpack>(
      this.buildpacks,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((b: StBuildpack) => {
          if (!q) return true;
          return (b.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.source) return;
    await this.source.load();
    this._buildpacks.set([...this.source.items()]);
  }

  async refresh(): Promise<void> {
    if (!this.source) return;
    await this.source.refresh();
    this._buildpacks.set([...this.source.items()]);
  }

  // Position default keeps natural staging order; clearing returns there.
  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'position', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StBuildpack) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
