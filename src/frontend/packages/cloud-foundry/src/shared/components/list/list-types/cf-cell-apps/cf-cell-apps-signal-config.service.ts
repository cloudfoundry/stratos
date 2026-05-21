import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ListStateStore } from '@stratosui/core';
import { MetricQueryConfig, MetricQueryType, MetricsDataService, MetricsRequest } from '@stratosui/store';

import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import { StApp } from '../../../../../services/endpoint-data/stratos-types';

// Per-cell app placement row. Joins the Diego rep CPU-percentage metric
// (which lists the app/instance pairs scheduled on this cell) with the
// native /pp/v1/cf/apps/:cnsi/:guid lookup that supplies name + space
// + org for the link columns. cnsiGuid is captured per row so multi-CF
// callers stay correct even though this service is single-CNSI today.
export interface CfCellAppRow {
  cnsiGuid: string;
  appGuid: string;
  instanceIndex: number;
  name: string;
  spaceGuid: string;
  spaceName: string;
  orgGuid: string;
  orgName: string;
}

interface PrometheusMetricApplication {
  application_id?: string;
  instance_index?: string;
  [k: string]: string | undefined;
}

interface PrometheusVectorResult {
  metric?: PrometheusMetricApplication;
  value?: [number, string];
}

// CPU-percentage metric exposes one vector per running app instance,
// labelled with application_id + instance_index. Used as the source-of-
// truth for "which apps are on this cell right now". HEALTHY metrics
// are cell-level; this one is per-instance and is what the legacy
// CfCellAppsDataSource queried as well.
const METRIC_CPU = 'firehose_container_metric_cpu_percentage';
const CELL_METRICS_BASE_URL = '/pp/v1/metrics/cf/cells';

// CF Cell Apps list config — single-CNSI, single-cell, read-only.
// Drives the Apps tab on the cell-detail page. Replaces
// CfCellAppsListConfigService + CfCellAppsDataSource (ngrx
// FetchCFMetricsPaginatedAction + ListDataSource) with a direct
// metrics fetch + per-app native lookup, mirroring W2's
// CfCellHealthSignalConfigService.
@Injectable({ providedIn: 'root' })
export class CfCellAppsSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly metricsDataService = inject(MetricsDataService);

  private cnsiGuid = '';
  private cellId = '';

  private readonly state = inject(ListStateStore).bind('cf-cell-apps', {
    viewMode: 'table',
    pageSize: [25, 24],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(r: CfCellAppRow) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<CfCellAppRow>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly viewMode = this.state.viewMode;

  private readonly _rows: WritableSignal<CfCellAppRow[]> = signal([]);
  readonly rows: Signal<CfCellAppRow[]> = this._rows.asReadonly();

  private readonly _isLoading: WritableSignal<boolean> = signal(false);
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: CfCellAppRow) => unknown>> = signal(new Map());

  // Per-cnsi app-detail cache — only used for the eager join during
  // loadAll/refresh. Same-(cnsi, guid) requests dedup through the
  // promise cache.
  private readonly appCache = new Map<string, Promise<StApp | null>>();

  view!: ViewPipeline<CfCellAppRow>;

  initialize(cnsiGuid: string, cellId: string): void {
    this.cnsiGuid = cnsiGuid;
    this.cellId = cellId;
    this.view = new ViewPipeline<CfCellAppRow>(
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
    this._isLoading.set(true);
    try {
      const placements = await this.fetchPlacements();
      if (placements === null) {
        this._rows.set([]);
        return;
      }
      const rows = await Promise.all(placements.map(p => this.toRow(p)));
      this._rows.set(rows);
    } finally {
      this._isLoading.set(false);
    }
  }

  async refresh(): Promise<void> {
    // Drop the per-app cache so name/space/org changes propagate. The
    // /pp/v1/cf/apps native handler is the source of truth, not the
    // metric pipeline, so refresh has to round-trip both.
    this.appCache.clear();
    await this.loadAll();
  }

  registerSortExtractor(fieldKey: string, extractor: (row: CfCellAppRow) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  private async fetchPlacements(): Promise<{ appGuid: string; instanceIndex: number }[] | null> {
    const req: MetricsRequest = {
      endpointGuid: this.cnsiGuid,
      url: CELL_METRICS_BASE_URL,
      query: new MetricQueryConfig(`${METRIC_CPU}{bosh_job_id="${this.cellId}"}`),
      queryType: MetricQueryType.QUERY,
      windowValue: null,
    };
    try {
      const metrics = await this.metricsDataService.fetch<PrometheusVectorResult>(req);
      const result = (metrics?.data?.result ?? []) as PrometheusVectorResult[];
      const out: { appGuid: string; instanceIndex: number }[] = [];
      for (const r of result) {
        const appGuid = r.metric?.application_id;
        if (!appGuid) continue;
        const idxRaw = r.metric?.instance_index;
        const instanceIndex = idxRaw !== undefined ? Number(idxRaw) : 0;
        out.push({ appGuid, instanceIndex });
      }
      return out;
    } catch {
      return null;
    }
  }

  private fetchApp(appGuid: string): Promise<StApp | null> {
    const key = `${this.cnsiGuid}:${appGuid}`;
    let p = this.appCache.get(key);
    if (!p) {
      p = firstValueFrom(this.http.get<StApp>(`/pp/v1/cf/apps/${this.cnsiGuid}/${appGuid}`))
        .catch((): StApp | null => null);
      this.appCache.set(key, p);
    }
    return p;
  }

  private async toRow(p: { appGuid: string; instanceIndex: number }): Promise<CfCellAppRow> {
    const app = await this.fetchApp(p.appGuid);
    return {
      cnsiGuid: this.cnsiGuid,
      appGuid: p.appGuid,
      instanceIndex: p.instanceIndex,
      name: app?.name ?? p.appGuid,
      spaceGuid: app?.spaceGuid ?? '',
      spaceName: app?.spaceName ?? '',
      orgGuid: app?.orgGuid ?? '',
      orgName: app?.orgName ?? '',
    };
  }
}
