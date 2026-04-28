import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { CnsiSecurityGroupsSource } from '../../../../../services/data-sources/cnsi-security-groups-source';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StSecurityGroup } from '../../../../../services/endpoint-data/stratos-types';

// CF Security Groups list config — single-CNSI, read-only. Drives the
// per-CF /cloud-foundry/:cnsi/security-groups tab. Security groups are
// foundation-level and may number in the dozens, so this service stays
// simple: own the fetch, expose a securityGroups() signal, run it
// through ViewPipeline. No writes — group create/edit/delete and space
// bindings are platform-admin operations not surfaced here.
@Injectable({ providedIn: 'root' })
export class CfSecurityGroupsSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  private cnsiGuid = '';
  private source?: CnsiSecurityGroupsSource;

  readonly filter: WritableSignal<(g: StSecurityGroup) => boolean> = signal(() => true);
  readonly sort: WritableSignal<SortSpec<StSecurityGroup>> = signal({ field: 'name', direction: 'asc' });
  readonly pageSize: WritableSignal<number> = signal(24);
  readonly pageIndex: WritableSignal<number> = signal(0);
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode: WritableSignal<'table' | 'card'> = signal('card');

  private readonly _securityGroups: WritableSignal<StSecurityGroup[]> = signal([]);
  readonly securityGroups: Signal<StSecurityGroup[]> = this._securityGroups.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StSecurityGroup) => unknown>> = signal(new Map());

  view!: ViewPipeline<StSecurityGroup>;

  initialize(cnsiGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.source = new CnsiSecurityGroupsSource(cnsiGuid, this.http);
    this.view = new ViewPipeline<StSecurityGroup>(
      this.securityGroups,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((g: StSecurityGroup) => {
          if (!q) return true;
          return (g.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.source) return;
    await this.source.load();
    this._securityGroups.set([...this.source.items()]);
  }

  async refresh(): Promise<void> {
    if (!this.source) return;
    await this.source.refresh();
    this._securityGroups.set([...this.source.items()]);
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StSecurityGroup) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
