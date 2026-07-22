import { Injectable, inject } from '@angular/core';
import { combineLatest, defer, Observable, from } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';

import { MetricsConfig } from '../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.types';
import {
  MetricsChartHelpers,
} from '../../../../../../../core/src/shared/components/metrics-chart/metrics.component.helpers';
import { MetricQueryConfig } from '../../../../../../../store/src/actions/metrics.actions';
import { MetricsDataService, MetricsRequest } from '../../../../../../../store/src/services/metrics-data.service';
import { IMetricMatrixResult, IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import { IMetricCell, MetricQueryType } from '../../../../../../../store/src/types/metric.types';
import { ActiveRouteCfCell } from '../../../cf-page.types';

const CELL_METRICS_BASE_URL = '/pp/v1/metrics/cf/cells';


export const enum CellMetrics {
  /**
   * Deprecated since Diego v2.31.0. See https://github.com/bosh-prometheus/prometheus-boshrelease/issues/333
   */
  HEALTHY_DEP = 'firehose_value_metric_rep_unhealthy_cell',
  /**
   * Available from Diego v2.31.0. See https://github.com/bosh-prometheus/prometheus-boshrelease/issues/333
   */
  HEALTHY = 'firehose_value_metric_rep_garden_health_check_failed',
  REMAINING_CONTAINERS = 'firehose_value_metric_rep_capacity_remaining_containers',
  REMAINING_DISK = 'firehose_value_metric_rep_capacity_remaining_disk',
  REMAINING_MEMORY = 'firehose_value_metric_rep_capacity_remaining_memory',
  TOTAL_CONTAINERS = 'firehose_value_metric_rep_capacity_total_containers',
  TOTAL_DISK = 'firehose_value_metric_rep_capacity_total_disk',
  TOTAL_MEMORY = 'firehose_value_metric_rep_capacity_total_memory',
  CPUS = 'firehose_value_metric_rep_num_cpus'
}


/**
 * Designed to be used once drilled down to a cell (see ActiveRouteCfCell)
 */
@Injectable({
  providedIn: 'root'
})
export class CloudFoundryCellService {
  private metricsDataService = inject(MetricsDataService);


  cfGuid!: string;
  cellId!: string;
  cellMetric$!: Observable<IMetricCell>;

  healthy$!: Observable<string>;
  cpus$!: Observable<string>;

  usageContainers$!: Observable<string>;
  remainingContainers$!: Observable<string>;
  totalContainers$!: Observable<string>;

  usageDisk$!: Observable<string>;
  remainingDisk$!: Observable<string>;
  totalDisk$!: Observable<string>;

  usageMemory$!: Observable<string>;
  remainingMemory$!: Observable<string>;
  totalMemory$!: Observable<string>;

  constructor() {
    const activeRouteCfCell = inject(ActiveRouteCfCell);


    this.cellId = activeRouteCfCell.cellId;
    this.cfGuid = activeRouteCfCell.cfGuid;

    this.remainingContainers$ = this.generate(CellMetrics.REMAINING_CONTAINERS);
    this.totalContainers$ = this.generate(CellMetrics.TOTAL_CONTAINERS);
    this.remainingDisk$ = this.generate(CellMetrics.REMAINING_DISK);
    this.totalDisk$ = this.generate(CellMetrics.TOTAL_DISK);
    this.remainingMemory$ = this.generate(CellMetrics.REMAINING_MEMORY);
    this.totalMemory$ = this.generate(CellMetrics.TOTAL_MEMORY);
    this.cpus$ = this.generate(CellMetrics.CPUS);

    this.usageContainers$ = this.generateUsage(this.remainingContainers$, this.totalContainers$);
    this.usageDisk$ = this.generateUsage(this.remainingDisk$, this.totalDisk$);
    this.usageMemory$ = this.generateUsage(this.remainingMemory$, this.totalMemory$);

    // Probe both the post-v2.31 and pre-v2.31 health metrics; the first
    // one that returns a value wins. Mirrors the previous CfCellHelper
    // pagination probe but without the ngrx round-trip.
    const healthMetric$ = defer(() => from(this.probeHealthMetric())).pipe(shareReplay(1));
    this.cellMetric$ = healthMetric$.pipe(
      switchMap(metric => this.generateForMetric<IMetricVectorResult<IMetricCell>>(metric, true) as Observable<IMetricCell>)
    );
    this.healthy$ = healthMetric$.pipe(
      switchMap(metric => this.generate(metric))
    );
  }

  public buildMetricConfig(
    queryString: string,
    queryRange: MetricQueryType,
    mapSeriesItemValue?: (value: number) => number): MetricsConfig<IMetricMatrixResult<IMetricCell>> {
    return {
      getSeriesName: (result: IMetricMatrixResult<IMetricCell>) => `Cell ${result.metric.bosh_job_id}`,
      mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
      mapSeriesItemValue,
      request: {
        endpointGuid: this.cfGuid,
        url: CELL_METRICS_BASE_URL,
        query: new MetricQueryConfig(queryString + `{bosh_job_id="${this.cellId}"}`, {}),
        queryType: queryRange,
        windowValue: null,
      },
    };
  }

  public buildChartConfig(yAxisLabel: string): MetricsLineChartConfig {
    const lineChartConfig = new MetricsLineChartConfig();
    lineChartConfig.xAxisLabel = 'Time';
    lineChartConfig.yAxisLabel = yAxisLabel;
    lineChartConfig.autoScale = false;
    return lineChartConfig;
  }

  private generate(metric: string): Observable<string> {
    return this.generateForMetric<IMetricVectorResult<IMetricCell>>(metric, false) as Observable<string>;
  }

  // Single-value vector lookup. If `returnMetric` is true, returns the
  // sample's `metric` label-set (used for the health-metric probe);
  // otherwise returns the sample value or null.
  private generateForMetric<T>(metric: string, returnMetric: boolean): Observable<IMetricCell | string | null> {
    const req: MetricsRequest = this.cellMetricRequest(metric);
    return from(this.metricsDataService.fetch<T>(req)).pipe(
      map(entity => {
        const data = entity?.data as any;
        if (!data || !data.result || data.result.length === 0) {
          return null;
        }
        if (returnMetric) {
          return data.result[0].metric as IMetricCell;
        }
        return data.result[0].value ? data.result[0].value[1] : null;
      })
    );
  }

  private cellMetricRequest(metric: string): MetricsRequest {
    return {
      endpointGuid: this.cfGuid,
      url: CELL_METRICS_BASE_URL,
      query: new MetricQueryConfig(`${metric}{bosh_job_id="${this.cellId}"}`, {}),
      queryType: MetricQueryType.QUERY,
      windowValue: null,
    };
  }

  // Picks the live health metric. Newer Diego (v2.31+) emits
  // `HEALTHY` (garden_health_check_failed); older Diego emits
  // `HEALTHY_DEP` (unhealthy_cell). We try the new one first and fall
  // back if it returns no samples for this cell.
  private async probeHealthMetric(): Promise<CellMetrics.HEALTHY | CellMetrics.HEALTHY_DEP> {
    const tryFetch = async (metric: CellMetrics) => {
      const m = await this.metricsDataService.fetch<any>(this.cellMetricRequest(metric));
      const result = m?.data?.result as any[] | undefined;
      return result && result.length > 0;
    };
    if (await tryFetch(CellMetrics.HEALTHY)) {
      return CellMetrics.HEALTHY;
    }
    return CellMetrics.HEALTHY_DEP;
  }

  private generateUsage(remaining$: Observable<string>, total$: Observable<string>): Observable<any> {
    return combineLatest([remaining$, total$]).pipe(
      map(([remaining, total]) => Number(total) - Number(remaining))
    );
  }
}
