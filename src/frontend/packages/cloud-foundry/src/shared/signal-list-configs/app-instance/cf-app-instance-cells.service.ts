import { Injectable, Signal, effect, inject, signal, untracked } from '@angular/core';

import { SignalListColumn } from '@stratosui/core';
import {
  EndpointsDataService,
  MetricQueryConfig,
  MetricQueryType,
  MetricsDataService,
} from '@stratosui/store';

import { AppDetailDataService } from '../../../features/applications/app-detail-data.service';
import type { StAppStat } from '../../../services/endpoint-data/stratos-types';

// Rep health metrics, current (Diego v2.31+) then pre-v2.31. A CF whose
// metrics endpoint returns either one for any cell has cell metrics.
const CELL_HEALTH_METRICS = [
  'firehose_value_metric_rep_garden_health_check_failed',
  'firehose_value_metric_rep_unhealthy_cell',
];
const CELL_METRICS_URL = '/pp/v1/metrics/cf/cells';

// One series per running app instance, labelled with instance_index and
// the cell it runs on (bosh_job_id).
const METRIC_CPU = 'firehose_container_metric_cpu_percentage';

interface ContainerMetricResult {
  metric?: { instance_index?: string; bosh_job_id?: string };
}

// Which cell each instance of the current app runs on, for the Cell
// column of the app instances list. Provided by the component that
// shows the list.
//
// start() checks that the CF has a metrics endpoint and that its cells
// report health metrics. Only then is available() true and the column
// shown; any user who can see the app gets it. Instance placement is
// read from the app-scoped metrics route
// (/pp/v1/metrics/cf/app/:appId), which serves only users who can see
// the app. Whenever the instance stats update and an instance has no
// cell yet (a new instance can take a while to report metrics), the
// placement is fetched again.
@Injectable()
export class CfAppInstanceCellsService {
  private readonly endpoints = inject(EndpointsDataService);
  private readonly metrics = inject(MetricsDataService);
  private readonly data = inject(AppDetailDataService);

  private readonly _available = signal(false);
  readonly available: Signal<boolean> = this._available.asReadonly();

  // instance index -> cell ID (bosh_job_id)
  private readonly _cells = signal<ReadonlyMap<number, string>>(new Map());
  readonly cells: Signal<ReadonlyMap<number, string>> = this._cells.asReadonly();

  private fetching = false;

  constructor() {
    effect(() => {
      const stats = this.data.stats();
      if (!this._available()) {
        return;
      }
      const cells = untracked(this._cells);
      if (stats.some(s => !cells.has(s.index))) {
        untracked(() => void this.fetchCells());
      }
    });
  }

  async start(): Promise<void> {
    if (await this.hasCellMetrics()) {
      this._available.set(true);
    }
  }

  // Cell column: the instance's cell ID, linking to that cell's
  // summary page. Blank until the instance's metric is seen.
  buildColumn(): SignalListColumn<StAppStat> {
    return {
      header: 'Cell', key: 'cell',
      kind: 'link',
      link: (row) => {
        const cell = this._cells().get(row.index);
        return cell ? ['/cloud-foundry', this.data.cnsiGuid, 'cells', cell, 'summary'] : null;
      },
      render: (row) => this._cells().get(row.index) ?? '',
      sortField: (row) => this._cells().get(row.index) ?? '',
    };
  }

  private async hasCellMetrics(): Promise<boolean> {
    const cnsiGuid = this.data.cnsiGuid;
    await this.endpoints.whenReady();
    if (!this.endpoints.endpoints().get(cnsiGuid)?.metadata?.metrics) {
      return false;
    }
    for (const metric of CELL_HEALTH_METRICS) {
      try {
        const res = await this.metrics.fetch({
          endpointGuid: cnsiGuid,
          url: CELL_METRICS_URL,
          query: new MetricQueryConfig(metric),
          queryType: MetricQueryType.QUERY,
        });
        if ((res?.data?.result?.length ?? 0) > 0) {
          return true;
        }
      } catch {
        // A failed probe counts as no cell metrics; the column stays hidden.
      }
    }
    return false;
  }

  private async fetchCells(): Promise<void> {
    if (this.fetching) {
      return;
    }
    this.fetching = true;
    try {
      const res = await this.metrics.fetch<ContainerMetricResult>({
        endpointGuid: this.data.cnsiGuid,
        url: `/pp/v1/metrics/cf/app/${this.data.appGuid}`,
        query: new MetricQueryConfig(METRIC_CPU),
        queryType: MetricQueryType.QUERY,
      });
      const next = new Map<number, string>();
      for (const r of (res?.data?.result ?? []) as ContainerMetricResult[]) {
        const index = r.metric?.instance_index;
        const cell = r.metric?.bosh_job_id;
        if (index !== undefined && cell) {
          next.set(Number(index), cell);
        }
      }
      this._cells.set(next);
    } catch {
      // Keep the cells already shown; the next stats update retries.
    } finally {
      this.fetching = false;
    }
  }
}
