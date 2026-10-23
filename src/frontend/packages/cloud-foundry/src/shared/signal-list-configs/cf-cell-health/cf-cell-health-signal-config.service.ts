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

type HealthFetch =
  | { ok: true; rows: CfCellHealthEntry[] }
  | { ok: false; error: unknown };

interface PrometheusResponseEnvelope {
  [cnsiGuid: string]: {
    status?: string;
    data?: {
      resultType?: string;
      result?: PrometheusVectorResult[];
    };
  };
}

// The health history covers the past hour, sampled in 50 steps. This
// is what the legacy list showed by default: its time-window picker
// started on "The past hour" and sent a range query with
// step = window / 50.
const HISTORY_WINDOW_SECONDS = 60 * 60;
const HISTORY_STEPS = 50;

// Cell-health history list config. Drives the table embedded in the
// cell-detail Summary tab. Sends a range query to
// /pp/v1/metrics/cf/cells/query_range and lists each change of the
// health value in the returned samples (`result[0].values`). The
// legacy list's time-window picker is not offered; the window is fixed.
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

  // Holds the CNSI guid -> error of the last failed load, or an empty
  // map. The list shows its error state with Retry while this is
  // non-empty and there are no rows.
  private readonly _errorsByCnsi: WritableSignal<Map<string, unknown>> = signal(new Map());
  readonly errorsByCnsi: Signal<Map<string, unknown>> = this._errorsByCnsi.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: CfCellHealthEntry) => unknown>> = signal(new Map());

  view!: ViewPipeline<CfCellHealthEntry>;

  initialize(cnsiGuid: string, cellId: string): void {
    // New scope → new data set: drop any page position the previous
    // scope left behind (#5670). Same scope re-entry keeps position.
    this.state.resetPageOnScopeChange(`${cnsiGuid}:${cellId}`);
    this.cnsiGuid = cnsiGuid;
    this.cellId = cellId;
    this._errorsByCnsi.set(new Map());
    this.view = new ViewPipeline<CfCellHealthEntry>(
      this.rows,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
  }

  // Uses the first health metric that has samples for this cell. When
  // neither has any, shows the error of the first failed request, or an
  // empty history when both requests succeeded.
  async loadAll(): Promise<void> {
    if (!this.cnsiGuid || !this.cellId) return;
    let failure: { error: unknown } | null = null;
    for (const metric of [METRIC_HEALTHY, METRIC_HEALTHY_DEPRECATED]) {
      const res = await this.fetchHealth(metric);
      if (res.ok && res.rows.length > 0) {
        this.activeMetric = metric;
        this.showRows(res.rows);
        return;
      }
      if (!res.ok && !failure) {
        failure = { error: res.error };
      }
    }
    this._rows.set([]);
    this._errorsByCnsi.set(failure ? new Map([[this.cnsiGuid, failure.error]]) : new Map());
    this._availability.set(false);
  }

  // Refetches the metric that last had data. A failure keeps the rows
  // already shown and flags the error.
  async refresh(): Promise<void> {
    if (!this.activeMetric) {
      await this.loadAll();
      return;
    }
    const res = await this.fetchHealth(this.activeMetric);
    if (res.ok) {
      this.showRows(res.rows);
    } else {
      this._errorsByCnsi.set(new Map([[this.cnsiGuid, res.error]]));
    }
  }

  private showRows(rows: CfCellHealthEntry[]): void {
    this._rows.set(rows);
    this._errorsByCnsi.set(new Map());
    this._availability.set(true);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: CfCellHealthEntry) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  private async fetchHealth(metric: string): Promise<HealthFetch> {
    const query = `${metric}{bosh_job_id="${this.cellId}"}`;
    const end = Math.floor(Date.now() / 1000);
    const start = end - HISTORY_WINDOW_SECONDS;
    const step = HISTORY_WINDOW_SECONDS / HISTORY_STEPS;
    const url = `/pp/v1/metrics/cf/cells/query_range?query=${encodeURIComponent(query)}`
      + `&start=${start}&end=${end}&step=${step}`;
    try {
      const resp = await firstValueFrom(
        this.http.get<PrometheusResponseEnvelope>(url, {
          headers: new HttpHeaders({ 'x-cap-cnsi-list': this.cnsiGuid }),
        }),
      );
      const cnsiResp = resp?.[this.cnsiGuid];
      const result = cnsiResp?.data?.result ?? [];
      if (!result.length) return { ok: true, rows: [] };
      const values = result[0].values;
      if (!values || !values.length) return { ok: true, rows: [] };
      return { ok: true, rows: mapMetricsToStates(values) };
    } catch (error) {
      return { ok: false, error };
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
