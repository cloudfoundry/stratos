import { EffectRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore } from '@stratosui/core';

import { AutoscalerConstants } from '../../../core/autoscaler-helpers/autoscaler-util';
import { AutoscalerPolicyDataService } from '../../../services/domain-data/autoscaler-policy-data.service';
import { AppScalingTrigger } from '../../../store/app-autoscaler.types';
import { APIResource } from '../../../../../store/src/types/api.types';

// CF Autoscaler metric-chart list config — single (cnsi, app), card-only.
// Drives the AutoScaler "Metric Charts" sub-page. Replaces
// AppAutoscalerMetricChartListConfigService + AppAutoscalerMetricChartDataSource;
// pulls the policy from AutoscalerPolicyDataService (signal-native) and
// derives one "trigger row" per metric-type — same shape the legacy
// effect built (`scaling_rules_map[metricType]` + `metadata.guid =
// createMetricId(appGuid, metricType)`). Last @ngrx survivor for the
// cf-autoscaler metric-chart list.
//
// Time-window state (windowValue + start/end) lives here so changing
// the page-level selector recomputes the rows; the chart card consumes
// `row.entity.query.params.{start,end}` and re-loads its metrics via
// the (already signal-native) AutoscalerMetricDataService.

export type AutoscalerMetricChartRow = APIResource<AppScalingTrigger>;

export interface SortSpec<T = unknown> {
  field: string;
  direction: 'asc' | 'desc';
  _phantom?: T;
}

const TWO_HOURS_MS = 1000 * 60 * 60 * 2;

// Map the 4 preset window labels to their durations, mirroring the
// legacy `customTimeWindows`. The legacy default was 30:minute;
// preserved here so the initial chart range matches what shipped before.
export interface MetricChartTimeWindow {
  value: string;
  label: string;
  durationMs: number;
}

export const METRIC_CHART_TIME_WINDOWS: MetricChartTimeWindow[] = [
  { value: '30:minute', label: 'The past 30 minutes', durationMs: 30 * 60 * 1000 },
  { value: '1:hour', label: 'The past 1 hour', durationMs: 60 * 60 * 1000 },
  { value: '2:hour', label: 'The past 2 hours', durationMs: TWO_HOURS_MS },
];

@Injectable({ providedIn: 'root' })
export class AppAutoscalerMetricChartSignalConfigService {
  private readonly policyData = inject(AutoscalerPolicyDataService);
  private readonly injector = inject(Injector);

  private cnsiGuid = '';
  private appGuid = '';

  // Per-mode UI state. Persisted under `cf-app-autoscaler-metric-chart`.
  // Card-only on the legacy list (`viewType = CARD_ONLY`); we preserve
  // that with `viewMode: 'card'` and a card-friendly default page size.
  private readonly state = inject(ListStateStore).bind('cf-app-autoscaler-metric-chart', {
    viewMode: 'card',
    pageSize: [12, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(r: AutoscalerMetricChartRow) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<AutoscalerMetricChartRow>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Selected time window. Default = 30:minute, matching the legacy
  // `customTimeInitialValue`. Writes here cause `rows` to recompute
  // with fresh `query.params.{start,end}`, and the chart card's effect
  // re-fetches its metrics through AutoscalerMetricDataService.
  readonly windowValue: WritableSignal<string> = signal(METRIC_CHART_TIME_WINDOWS[0].value);
  readonly windows: MetricChartTimeWindow[] = METRIC_CHART_TIME_WINDOWS;

  // Rows derived from policy + current window. One row per metric type
  // present in `policy.scaling_rules_map` (same source the legacy
  // effect's `transformTriggerData` consumed). Each row gets a synthetic
  // metadata.guid (`appGuid:metricType`) and an `entity.query.params`
  // carrying the seconds-since-epoch start/end the chart card reads.
  readonly rows: Signal<AutoscalerMetricChartRow[]> = computed(() => {
    if (!this.cnsiGuid || !this.appGuid) return [];
    const policy = this.policyData.policy(this.cnsiGuid, this.appGuid)();
    if (!policy || !policy.scaling_rules_map) return [];
    const win = this.windows.find(w => w.value === this.windowValue()) ?? this.windows[0];
    const end = Math.floor(Date.now() / 1000);
    const start = end - Math.floor(win.durationMs / 1000);
    return Object.keys(policy.scaling_rules_map).map(metricType => {
      const id = AutoscalerConstants.createMetricId(this.appGuid, metricType);
      const trigger: AppScalingTrigger = {
        ...policy.scaling_rules_map[metricType],
        query: { metric: 'policy', params: { start, end } },
      };
      // APIResourceMetadata requires created_at/updated_at/url even
      // though the legacy effect only ever populated `guid` (the chart
      // card / row plumbing reads `metadata.guid` exclusively). We keep
      // the unused fields blank to satisfy the type.
      return {
        entity: trigger,
        metadata: { guid: id, created_at: '', updated_at: '', url: '' },
      } satisfies AutoscalerMetricChartRow;
    });
  });

  // Mirrors the data service's loading state for the policy fetch so
  // the SignalListComponent shows its spinner only during the initial
  // load. After the first resolve the subsequent re-fetches are silent.
  private readonly _hasLoadedOnce: WritableSignal<boolean> = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  // Local view pipeline (filter → sort → page). Inlined to mirror the
  // companion configs (events, kubernetes-endpoints) — hoisting it into
  // a shared place is a separate refactor outside this wave's scope.
  view!: ViewPipeline<AutoscalerMetricChartRow>;

  // Captured so a re-entry (root singleton, but initialize() runs per mount)
  // destroys the prior filter effect instead of stacking one per navigation.
  private filterEffect?: EffectRef;

  initialize(cnsiGuid: string, appGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.appGuid = appGuid;

    this.view = new ViewPipeline<AutoscalerMetricChartRow>(
      this.rows,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
    );

    this.filterEffect?.destroy();
    runInInjectionContext(this.injector, () => {
      this.filterEffect = effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((row: AutoscalerMetricChartRow) => {
          if (!q) return true;
          // Free-text filter scans the metric type (only meaningful
          // human-readable field on a trigger row); same field shown
          // as the card title.
          const metricType = AutoscalerConstants.getMetricFromMetricId(row.metadata.guid);
          return metricType.toLowerCase().includes(q);
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.cnsiGuid || !this.appGuid) return;
    try {
      await this.policyData.load(this.cnsiGuid, this.appGuid);
    } finally {
      this._hasLoadedOnce.set(true);
    }
  }

  refresh(): Promise<void> {
    return this.loadAll();
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  setWindow(value: string): void {
    if (this.windows.some(w => w.value === value)) {
      this.windowValue.set(value);
    }
  }

  // Reads the current window's [startSec, endSec] tuple — useful for
  // tests and for the legend if the page wants to display the range.
  // Recomputed each call so it tracks `Date.now()`.
  currentRangeSeconds(): { start: number; end: number } {
    const win = this.windows.find(w => w.value === this.windowValue()) ?? this.windows[0];
    const end = Math.floor(Date.now() / 1000);
    const start = end - Math.floor(win.durationMs / 1000);
    return { start, end };
  }
}

// Local view pipeline — same shape as the inline copy in
// `cf-app-autoscaler-events-signal-config.service.ts` and the kubernetes
// endpoints config. Sort field is a string property name on the row;
// for trigger rows the only sortable field is the derived metric type
// (computed off `metadata.guid`) — handled by an extractor map in the
// future if more sort axes appear.
export class ViewPipeline<T> {
  readonly filteredItems: Signal<T[]>;
  readonly sortedItems: Signal<T[]>;
  readonly pagedItems: Signal<T[]>;
  readonly totalFilteredResults: Signal<number>;
  readonly totalPages: Signal<number>;

  constructor(
    private readonly items: Signal<T[]>,
    private readonly filter: Signal<(row: T) => boolean>,
    private readonly sort: Signal<SortSpec<T>>,
    private readonly pageSize: Signal<number>,
    private readonly pageIndex: Signal<number>,
  ) {
    this.filteredItems = computed(() => this.items().filter(this.filter()));
    this.sortedItems = computed(() => {
      const spec = this.sort();
      const sign = spec.direction === 'asc' ? 1 : -1;
      // For metric-chart rows the sortable axis is the metric type,
      // which lives in metadata.guid (created via createMetricId). Any
      // other future sort field falls back to a property lookup on the
      // row itself.
      const getValue: (row: T) => unknown = (row: T) => {
        if (spec.field === 'name') {
          const meta = (row as unknown as { metadata?: { guid?: string } }).metadata;
          return meta?.guid ?? '';
        }
        return (row as Record<string, unknown>)[spec.field];
      };
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
      const size = this.pageSize();
      const start = this.pageIndex() * size;
      return this.sortedItems().slice(start, start + size);
    });
    this.totalFilteredResults = computed(() => this.filteredItems().length);
    this.totalPages = computed(() => Math.ceil(this.totalFilteredResults() / this.pageSize()));
  }
}

