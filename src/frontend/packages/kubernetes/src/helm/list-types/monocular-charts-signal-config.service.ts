import { Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore, SignalListSort, naturalCompare } from '@stratosui/core';

import { KubeHelmDataService } from '../../services/endpoint-data/kube-helm-data.service';
import { MonocularChart, StratosError } from '../../services/endpoint-data/kube-types';

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

// Signal-native list config for the monocular-charts (helm catalog) page.
// Pulls from KubeHelmDataService.monocularCharts() — a flat catalog
// merged across all connected helm repo + Artifact Hub endpoints.
//
// Wave-2 keeps the surface tight: name + description + repository
// columns, plus a name filter and a repository filter. The legacy
// page also surfaced a per-repo sidebar (catalog-tab.component.html);
// the signal-config exposes `repositoryFilter` so the host can drive
// it, leaving the sidebar UI in the host component.

@Injectable({ providedIn: 'root' })
export class MonocularChartsSignalConfigService {
  private readonly helmData = inject(KubeHelmDataService);
  private readonly injector = inject(Injector);

  private readonly state = inject(ListStateStore).bind('helm-charts', {
    viewMode: 'card',
    pageSize: [9, 9],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(c: MonocularChart) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SignalListSort> as WritableSignal<KubeSortSpec<MonocularChart>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Repository filter — empty = all, 'Artifact Hub' = only hub-sourced
  // charts (legacy convention), otherwise an exact repo name match.
  readonly repositoryFilter: WritableSignal<string> = signal('');

  private readonly _charts: Signal<MonocularChart[]> = this.helmData.monocularCharts();
  get charts(): Signal<MonocularChart[]> { return this._charts; }

  private readonly _sortExtractors: WritableSignal<Map<string, (row: MonocularChart) => unknown>> = signal(new Map<string, (row: MonocularChart) => unknown>([
    ['name', (c: MonocularChart) => (c.name ?? c.attributes?.name ?? '').toLowerCase()],
    ['description', (c: MonocularChart) => (c.attributes?.description ?? '').toLowerCase()],
    ['repository', (c: MonocularChart) => (c.attributes?.repo?.name ?? '').toLowerCase()],
  ]));

  view!: KubeViewPipeline<MonocularChart>;

  errors(): Signal<StratosError[]> {
    return this.helmData.errors();
  }

  isLoading(): Signal<boolean> {
    return this.helmData.isLoadingCharts();
  }

  initialize(): void {
    this.view = new KubeViewPipeline<MonocularChart>(
      this._charts,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        const repo = this.repositoryFilter();
        const isHubFilter = repo === 'Artifact Hub';
        this.filter.set((c: MonocularChart) => {
          if (repo) {
            if (isHubFilter) {
              if (!c.monocularEndpointId) return false;
            } else if (c.attributes?.repo?.name !== repo) {
              return false;
            }
          }
          if (q && !((c.name ?? c.attributes?.name ?? '').toLowerCase().includes(q))) return false;
          return true;
        });
      });
    });
  }

  // Computed unique-repo lists — the host sidebar consumes these to
  // render the per-repo filter columns. Kept in the config so the host
  // doesn't have to recompute them.
  readonly stratosRepos: Signal<string[]> = computed(() => {
    const seen = new Set<string>();
    this._charts().forEach(c => {
      if (!c.monocularEndpointId) {
        const n = c.attributes?.repo?.name;
        if (n) seen.add(n);
      }
    });
    return Array.from(seen).sort((a, b) => naturalCompare(a, b));
  });

  readonly artifactHubRepos: Signal<string[]> = computed(() => {
    const seen = new Set<string>();
    this._charts().forEach(c => {
      if (c.monocularEndpointId) {
        const n = c.attributes?.repo?.name;
        if (n) seen.add(n);
      }
    });
    return Array.from(seen).sort((a, b) => naturalCompare(a, b));
  });

  async loadAll(): Promise<void> {
    if (this.helmData.chartsLastFetched() === null) {
      await this.helmData.loadCharts();
    }
  }

  async refresh(): Promise<void> {
    await this.helmData.loadCharts();
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.repositoryFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: MonocularChart) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
