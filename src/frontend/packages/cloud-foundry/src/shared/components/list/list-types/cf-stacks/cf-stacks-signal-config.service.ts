import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ListStateStore } from '@stratosui/core';

import { CnsiStacksSource } from '../../../../../services/data-sources/cnsi-stacks-source';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StStack } from '../../../../../services/endpoint-data/stratos-types';

// CF Stacks list config — single-CNSI, read-only. Drives the per-CF
// /cloud-foundry/:cnsi/stacks tab. Stacks are foundation-level metadata
// (rootfs flavors); they don't relate to orgs / spaces / apps and are
// rarely many (typically <10), so this service stays simple: own the
// fetch, expose a stacks() signal, run it through ViewPipeline. No
// writes — stack creation/edit/delete are platform-admin operations
// not surfaced here.
@Injectable({ providedIn: 'root' })
export class CfStacksSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  private cnsiGuid = '';
  private source?: CnsiStacksSource;

  private readonly state = inject(ListStateStore).bind('cf-stacks', {
    viewMode: 'card',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(s: StStack) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StStack>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  private readonly _stacks: WritableSignal<StStack[]> = signal([]);
  readonly stacks: Signal<StStack[]> = this._stacks.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StStack) => unknown>> = signal(new Map());

  view!: ViewPipeline<StStack>;

  initialize(cnsiGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.source = new CnsiStacksSource(cnsiGuid, this.http);
    this.view = new ViewPipeline<StStack>(
      this.stacks,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((s: StStack) => {
          if (!q) return true;
          return (s.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.source) return;
    await this.source.load();
    this._stacks.set([...this.source.items()]);
  }

  async refresh(): Promise<void> {
    if (!this.source) return;
    await this.source.refresh();
    this._stacks.set([...this.source.items()]);
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StStack) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
