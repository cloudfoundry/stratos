import { EffectRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ListStateStore, SignalListSort } from '@stratosui/core';

import { KubeAnalysisDataService } from '../../../services/domain-data/kube-analysis-data.service';
import { AnalysisReport, StratosError } from '../../../services/endpoint-data/kube-types';

// Sort spec used inside the signal-config. Mirrors the namespaces page
// implementation; when more than two list pages need this we'll lift it
// into a shared `services/data-sources/` module.
interface KubeSortSpec<T> {
  field: string;
  direction: 'asc' | 'desc';
  _phantom?: T;
}

class KubeViewPipeline<T> {
  readonly filteredItems: Signal<T[]>;
  readonly sortedItems: Signal<T[]>;
  readonly pagedItems: Signal<T[]>;
  readonly totalFilteredResults: Signal<number>;
  readonly totalPages: Signal<number>;

  constructor(
    items: Signal<T[]>,
    filter: Signal<(row: T) => boolean>,
    sort: Signal<KubeSortSpec<T>>,
    pageSize: Signal<number>,
    pageIndex: Signal<number>,
    keyExtractors: Signal<Map<string, (row: T) => unknown>>,
  ) {
    this.filteredItems = computed(() => items().filter(filter()));
    this.sortedItems = computed(() => {
      const spec = sort();
      const sign = spec.direction === 'asc' ? 1 : -1;
      const extractor = keyExtractors().get(spec.field);
      const getValue: (row: T) => unknown = extractor
        ? extractor
        : (row: T) => (row as Record<string, unknown>)[spec.field];
      return [...this.filteredItems()].sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') {
          return (av - bv) * sign;
        }
        return av < bv ? -1 * sign : av > bv ? 1 * sign : 0;
      });
    });
    this.pagedItems = computed(() => {
      const size = pageSize();
      const idx = pageIndex();
      return this.sortedItems().slice(idx * size, idx * size + size);
    });
    this.totalFilteredResults = computed(() => this.filteredItems().length);
    this.totalPages = computed(() => {
      const n = this.totalFilteredResults();
      const size = pageSize();
      return size > 0 ? Math.max(1, Math.ceil(n / size)) : 1;
    });
  }
}

// Signal-native list config for the analysis-reports tab. Drives a
// single-cluster analysis-reports list via the per-endpoint cache on
// `KubeAnalysisDataService`.
//
// Usage from the host component:
//   svc.initialize(kubeGuid);
//   void svc.loadAll();
//   // ...bind svc.view.pagedItems / svc.sort / svc.pageSize / etc. to
//   //    a SignalListConfig and pass it to <app-signal-list>.
//
// The legacy ngrx datasource polled the API every 5 seconds; the signal
// path drops that polling — refresh is user-driven via the toolbar
// "Refresh" button on <app-signal-list>. If we discover real "report
// just appeared" UX needs here, a wave-3 enhancement can re-add a
// debounced poll behind a feature flag.

@Injectable({ providedIn: 'root' })
export class AnalysisReportsSignalConfigService {
  private readonly analysisData = inject(KubeAnalysisDataService);
  private readonly injector = inject(Injector);

  private kubeGuid = '';

  private readonly state = inject(ListStateStore).bind('kube-analysis-reports', {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(r: AnalysisReport) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SignalListSort> as WritableSignal<KubeSortSpec<AnalysisReport>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  private _reports!: Signal<AnalysisReport[]>;
  get reports(): Signal<AnalysisReport[]> {
    return this._reports;
  }

  private readonly _sortExtractors: WritableSignal<Map<string, (row: AnalysisReport) => unknown>> = signal(new Map<string, (row: AnalysisReport) => unknown>([
    ['name', (r: AnalysisReport) => (r.name ?? '').toLowerCase()],
    ['type', (r: AnalysisReport) => (r.type ?? '').toLowerCase()],
    ['status', (r: AnalysisReport) => (r.status ?? '').toLowerCase()],
    ['created', (r: AnalysisReport) => {
      // Backend may serialise `created` as ISO string or ms-epoch number;
      // normalise to ms-since-epoch so descending = newest-first.
      const c = r.created as unknown;
      if (c instanceof Date) return c.getTime();
      if (typeof c === 'number') return c;
      if (typeof c === 'string') {
        const t = Date.parse(c);
        return Number.isNaN(t) ? 0 : t;
      }
      return 0;
    }],
  ]));

  view!: KubeViewPipeline<AnalysisReport>;

  // Captured so a re-entry (root singleton, but initialize() runs per mount)
  // destroys the prior filter effect instead of stacking one per navigation.
  private filterEffect?: EffectRef;

  errors(): Signal<StratosError[]> {
    return this.analysisData.errors();
  }

  // No `isLoading` on the data service today — the legacy list has no
  // dedicated spinner either; fetches are quick enough that we lean on
  // <app-signal-list>'s built-in empty-state messaging. Wave-3 can
  // surface a per-endpoint loading flag if needed.
  isLoading(): Signal<boolean> {
    return signal(false).asReadonly();
  }

  initialize(kubeGuid: string): void {
    this.kubeGuid = kubeGuid;
    this._reports = this.analysisData.reportsForEndpoint(kubeGuid);

    this.view = new KubeViewPipeline<AnalysisReport>(
      this._reports,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    this.filterEffect?.destroy();
    runInInjectionContext(this.injector, () => {
      this.filterEffect = effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((r: AnalysisReport) => {
          if (!q) return true;
          return (r.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.kubeGuid) return;
    await firstValueFrom(this.analysisData.loadReports(this.kubeGuid));
  }

  async refresh(): Promise<void> {
    if (!this.kubeGuid) return;
    await this.analysisData.refresh({ kubeGuid: this.kubeGuid });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: AnalysisReport) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
