import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ListStateStore } from '@stratosui/core';

import { ViewPipeline, SortSpec } from '../../../services/data-sources/view-pipeline';

// Diego cell metric label set returned by Prometheus for the rep-health
// query. We don't reuse IMetricCell from the legacy store types because
// the row shape we render is flatter than the raw Prometheus vector
// result — pulling it apart here also keeps the new service free of any
// `@stratosui/store` metric-types entanglement.
export interface CfCellRow {
  cnsiGuid: string;
  // bosh_job_id is the cell's BOSH instance index; used as the link key
  // into the cell-detail page.
  id: string;
  name: string;
  deployment: string;
  // Diego rep emits 0 = healthy, 1 = unhealthy. We keep the raw string
  // alongside the boolean so consumers can reason about either.
  healthyRaw: string;
  healthy: boolean;
}

interface PrometheusVectorResult {
  metric: {
    bosh_job_id?: string;
    bosh_job_name?: string;
    bosh_deployment?: string;
    [k: string]: string | undefined;
  };
  // [unixTimestamp, sampleValueAsString]
  value: [number, string];
}

interface PrometheusResponseEnvelope {
  [cnsiGuid: string]: {
    status?: string;
    data?: {
      resultType?: string;
      result?: PrometheusVectorResult[];
    };
  };
}

// Two metric names cover Diego rep health across versions. HEALTHY is
// emitted from Diego v2.31+; HEALTHY_DEP is the pre-v2.31 name we fall
// back to so older foundations still light up the Cells tab. See
// https://github.com/bosh-prometheus/prometheus-boshrelease/issues/333.
const METRIC_HEALTHY = 'firehose_value_metric_rep_garden_health_check_failed';
const METRIC_HEALTHY_DEPRECATED = 'firehose_value_metric_rep_unhealthy_cell';

// CF Cells list config — single-CNSI, read-only. Drives the per-CF
// /cloud-foundry/:cnsi/cells tab. Cell data comes from the metrics
// plugin (Prometheus-style), NOT a CAPI v3 resource — we hit the
// jetstream metrics passthrough at /pp/v1/metrics/cf/cells/query and
// flatten the vector result into one row per cell. The legacy path
// went through ngrx + PaginationMonitor; this service replaces that
// with a plain http.get + writable signal, mirroring CfStacks /
// CfBuildpacks.
//
// availability(): a tri-state — undefined while the first probe is in
// flight, true if either metric returned data, false if neither did.
// The component uses this to switch between the empty-state message
// and the list itself, replacing the legacy hasCellMetrics$ Observable
// gate.
@Injectable({ providedIn: 'root' })
export class CfCellsSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  private cnsiGuid = '';
  // The metric name we ended up using for this CNSI — set during
  // initialize() and reused by refresh() so we don't re-probe both
  // metrics on every refresh.
  private activeMetric: string | null = null;

  private readonly state = inject(ListStateStore).bind('cf-cells', {
    viewMode: 'table',
    pageSize: [25, 24],
    pageIndex: [0, 0],
    sort: [{ field: 'id', direction: 'asc' }, { field: 'id', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(c: CfCellRow) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<CfCellRow>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  private readonly _cells: WritableSignal<CfCellRow[]> = signal([]);
  readonly cells: Signal<CfCellRow[]> = this._cells.asReadonly();

  // undefined = not yet probed; true/false once we've heard back. The
  // empty-state branch in the component reads this to decide between
  // "Cell information for this Cloud Foundry cannot be found." and
  // showing the list (even if the list itself is empty).
  private readonly _availability: WritableSignal<boolean | undefined> = signal(undefined);
  readonly availability: Signal<boolean | undefined> = this._availability.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: CfCellRow) => unknown>> = signal(new Map());

  view!: ViewPipeline<CfCellRow>;

  initialize(cnsiGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.view = new ViewPipeline<CfCellRow>(
      this.cells,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((c: CfCellRow) => {
          if (!q) return true;
          // Filter against id + name; deployment is shown but rarely
          // typed as a search key.
          return (
            (c.id ?? '').toLowerCase().includes(q) ||
            (c.name ?? '').toLowerCase().includes(q)
          );
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.cnsiGuid) return;
    // First-time probe: try the new metric, fall back to the deprecated
    // one if the new query came back empty. We only probe both metrics
    // once; subsequent refreshes go straight to the active metric.
    let rows = await this.fetchCells(METRIC_HEALTHY);
    let usedMetric: string | null = METRIC_HEALTHY;
    if (rows === null || rows.length === 0) {
      const fallback = await this.fetchCells(METRIC_HEALTHY_DEPRECATED);
      if (fallback !== null && fallback.length > 0) {
        rows = fallback;
        usedMetric = METRIC_HEALTHY_DEPRECATED;
      }
    }
    if (rows && rows.length > 0) {
      this.activeMetric = usedMetric;
      this._cells.set(rows);
      this._availability.set(true);
    } else if (rows === null) {
      // Both probes errored; treat as no metrics available.
      this._cells.set([]);
      this._availability.set(false);
    } else {
      // Both probes returned empty — endpoint has metrics plumbed but
      // no cell-rep data is being scraped (or is unsupported). Surface
      // the same empty-state message the legacy gate used.
      this._cells.set([]);
      this._availability.set(false);
    }
  }

  async refresh(): Promise<void> {
    // If we never resolved a metric (availability false / unknown), do
    // a full re-probe — the foundation may have just had Diego rep
    // metrics turned on.
    if (!this.activeMetric) {
      await this.loadAll();
      return;
    }
    const rows = await this.fetchCells(this.activeMetric);
    if (rows !== null) {
      this._cells.set(rows);
      this._availability.set(true);
    }
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'id', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: CfCellRow) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Hits the jetstream metrics passthrough. Returns null if the request
  // errored (network/auth/upstream-down) and an empty array if the
  // upstream returned no vector entries — the caller distinguishes
  // these to drive the availability tri-state.
  private async fetchCells(metric: string): Promise<CfCellRow[] | null> {
    const url = `/pp/v1/metrics/cf/cells/query?query=${encodeURIComponent(metric)}`;
    try {
      const resp = await firstValueFrom(
        this.http.get<PrometheusResponseEnvelope>(url, {
          headers: new HttpHeaders({ 'x-cap-cnsi-list': this.cnsiGuid }),
        }),
      );
      const cnsiResp = resp?.[this.cnsiGuid];
      const result = cnsiResp?.data?.result ?? [];
      // Dedup on bosh_job_id — prometheus shouldn't return duplicates
      // for the same cell, but we belt-and-brace it so the row-key
      // contract (unique per cell) holds.
      const seen = new Set<string>();
      const rows: CfCellRow[] = [];
      for (const r of result) {
        const id = r.metric?.bosh_job_id ?? '';
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const value = r.value?.[1] ?? '';
        rows.push({
          cnsiGuid: this.cnsiGuid,
          id,
          name: r.metric?.bosh_job_name ?? '',
          deployment: r.metric?.bosh_deployment ?? '',
          healthyRaw: value,
          healthy: value === '0',
        });
      }
      return rows;
    } catch {
      return null;
    }
  }
}
