import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ListStateStore } from '@stratosui/core';

import { ViewPipeline, SortSpec } from '../../../services/data-sources/view-pipeline';

// Two metric names cover Diego rep health across versions. Newer Diego
// emits the garden-health-check-failed metric; pre-v2.31 foundations
// still use the deprecated unhealthy_cell name. Mirrors the probe in
// CfCellsSignalConfigService — we don't share the constants because the
// per-cell page may grow its own metric set as range queries are added.
const METRIC_HEALTHY = 'firehose_value_metric_rep_garden_health_check_failed';
const METRIC_HEALTHY_DEPRECATED = 'firehose_value_metric_rep_unhealthy_cell';

export enum CfCellHealthState {
  HEALTHY = 0,
  UNHEALTHY = 1,
  INITIAL_HEALTHY = 2,
  INITIAL_UNHEALTHY = 3,
}

export interface CfCellHealthEntry {
  timestamp: number;
  state: CfCellHealthState;
}

interface PrometheusVectorResult {
  metric?: Record<string, string | undefined>;
  // Instant query — single [unixTs, sampleAsString].
  value?: [number, string];
  // Range query — array of [unixTs, sampleAsString] over the window.
  values?: [number, string][];
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

// Cell-health history list config. Drives the table embedded in the
// cell-detail Summary tab. Replaces CfCellHealthListConfigService +
// CfCellHealthDataSource (ngrx + PaginationMonitor + ListDataSource)
// with a direct fetch against /pp/v1/metrics/cf/cells/query and a
// signal-backed row collection, matching CfCellsSignalConfigService.
//
// Behavior parity: the legacy data source parsed `result[0].values`
// (range-query matrix) but the action was dispatched with QUERY
// (instant), so the legacy table almost always rendered empty. We
// preserve that — instant query, parse `.values` if a range somehow
// arrives, otherwise fall through to an empty list. A future change
// can wire the window-picker UI back in by switching to query_range.
@Injectable({ providedIn: 'root' })
export class CfCellHealthSignalConfigService {
  private readonly http = inject(HttpClient);

  private cnsiGuid = '';
  private cellId = '';
  private activeMetric: string | null = null;

  private readonly state = inject(ListStateStore).bind('cf-cell-health', {
    viewMode: 'table',
    pageSize: [10, 12],
    pageIndex: [0, 0],
    sort: [
      { field: 'timestamp', direction: 'desc' },
      { field: 'timestamp', direction: 'desc' },
    ],
  });

  readonly filter: WritableSignal<(r: CfCellHealthEntry) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<CfCellHealthEntry>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly viewMode = this.state.viewMode;

  private readonly _rows: WritableSignal<CfCellHealthEntry[]> = signal([]);
  readonly rows: Signal<CfCellHealthEntry[]> = this._rows.asReadonly();

  private readonly _availability: WritableSignal<boolean | undefined> = signal(undefined);
  readonly availability: Signal<boolean | undefined> = this._availability.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: CfCellHealthEntry) => unknown>> = signal(new Map());

  view!: ViewPipeline<CfCellHealthEntry>;

  initialize(cnsiGuid: string, cellId: string): void {
    this.cnsiGuid = cnsiGuid;
    this.cellId = cellId;
    this.view = new ViewPipeline<CfCellHealthEntry>(
      this.rows,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
  }

  async loadAll(): Promise<void> {
    if (!this.cnsiGuid || !this.cellId) return;
    let rows = await this.fetchHealth(METRIC_HEALTHY);
    let usedMetric: string | null = METRIC_HEALTHY;
    if (rows === null || rows.length === 0) {
      const fallback = await this.fetchHealth(METRIC_HEALTHY_DEPRECATED);
      if (fallback !== null && fallback.length > 0) {
        rows = fallback;
        usedMetric = METRIC_HEALTHY_DEPRECATED;
      }
    }
    if (rows && rows.length > 0) {
      this.activeMetric = usedMetric;
      this._rows.set(rows);
      this._availability.set(true);
    } else if (rows === null) {
      this._rows.set([]);
      this._availability.set(false);
    } else {
      this._rows.set([]);
      this._availability.set(false);
    }
  }

  async refresh(): Promise<void> {
    if (!this.activeMetric) {
      await this.loadAll();
      return;
    }
    const rows = await this.fetchHealth(this.activeMetric);
    if (rows !== null) {
      this._rows.set(rows);
      this._availability.set(true);
    }
  }

  registerSortExtractor(fieldKey: string, extractor: (row: CfCellHealthEntry) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  private async fetchHealth(metric: string): Promise<CfCellHealthEntry[] | null> {
    const query = `${metric}{bosh_job_id="${this.cellId}"}`;
    const url = `/pp/v1/metrics/cf/cells/query?query=${encodeURIComponent(query)}`;
    try {
      const resp = await firstValueFrom(
        this.http.get<PrometheusResponseEnvelope>(url, {
          headers: new HttpHeaders({ 'x-cap-cnsi-list': this.cnsiGuid }),
        }),
      );
      const cnsiResp = resp?.[this.cnsiGuid];
      const result = cnsiResp?.data?.result ?? [];
      if (!result.length) return [];
      const values = result[0].values;
      if (!values || !values.length) return [];
      return mapMetricsToStates(values);
    } catch {
      return null;
    }
  }
}

function mapMetricsToStates(values: [number, string][]): CfCellHealthEntry[] {
  const out = values.reduce(
    (res, value, index) => {
      const timestamp = value[0];
      const state = value[1];
      if (index === 0) {
        res.current = state;
        res.collection.push({
          timestamp,
          state: state === '0' ? CfCellHealthState.INITIAL_HEALTHY : CfCellHealthState.INITIAL_UNHEALTHY,
        });
      } else if (res.current !== state) {
        res.current = state;
        res.collection.push({
          timestamp,
          state: state === '0' ? CfCellHealthState.HEALTHY : CfCellHealthState.UNHEALTHY,
        });
      }
      return res;
    },
    { current: null as string | null, collection: [] as CfCellHealthEntry[] },
  );
  return out.collection;
}
