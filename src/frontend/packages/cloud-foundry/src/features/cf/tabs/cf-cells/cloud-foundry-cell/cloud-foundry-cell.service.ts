import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import type { GeneralEntityAppState } from '@stratosui/store';
import { combineLatest, type Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import type { MetricsConfig } from '../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.types';
import {
  MetricsChartHelpers,
} from '../../../../../../../core/src/shared/components/metrics-chart/metrics.component.helpers';
import { MetricQueryConfig } from '../../../../../../../store/src/actions/metrics.actions';
import type { AppState } from '../../../../../../../store/src/app-state';
import { EntityServiceFactory } from '../../../../../../../store/src/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import type { IMetricMatrixResult, IMetrics, IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import { type IMetricCell, MetricQueryType } from '../../../../../../../store/src/types/metric.types';
import { FetchCFCellMetricsAction } from '../../../../../actions/cf-metrics.actions';
import { CfCellHelper } from '../../../cf-cell.helpers';
import type { ActiveRouteCfCell } from '../../../cf-page.types';


export enum CellMetrics {
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

  cfGuid!: string;
  cellId!: string;
  cellMetric$!: Observable<IMetricCell>;

  healthy$!: Observable<string>;
  healthyMetricId!: string;
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

  constructor(
    activeRouteCfCell: ActiveRouteCfCell,
    private entityServiceFactory: EntityServiceFactory,
    store: Store<GeneralEntityAppState>,
    paginationMonitorFactory: PaginationMonitorFactory) {

    this.cellId = activeRouteCfCell.cellId;
    this.cfGuid = activeRouteCfCell.cfGuid;

    this.remainingContainers$ = this.generate(CellMetrics.REMAINING_CONTAINERS, false);
    this.totalContainers$ = this.generate(CellMetrics.TOTAL_CONTAINERS, false);
    this.remainingDisk$ = this.generate(CellMetrics.REMAINING_DISK, false);
    this.totalDisk$ = this.generate(CellMetrics.TOTAL_DISK, false);
    this.remainingMemory$ = this.generate(CellMetrics.REMAINING_MEMORY, false);
    this.totalMemory$ = this.generate(CellMetrics.TOTAL_MEMORY, false);
    this.cpus$ = this.generate(CellMetrics.CPUS, false);

    this.usageContainers$ = this.generateUsage(this.remainingContainers$, this.totalContainers$);
    this.usageDisk$ = this.generateUsage(this.remainingDisk$, this.totalDisk$);
    this.usageMemory$ = this.generateUsage(this.remainingMemory$, this.totalMemory$);

    const cellHelper = new CfCellHelper(store, paginationMonitorFactory);
    const action$ = cellHelper.createCellMetricAction(this.cfGuid);
    this.cellMetric$ = action$.pipe(
      switchMap(action => {
        this.healthyMetricId = action.guid;
        return this.generate(action.query.metric as CellMetrics, true);
      })
    );
    this.healthy$ = action$.pipe(
      switchMap(action => {
        return this.generate(action.query.metric as CellMetrics, false);
      })
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
      metricsAction: new FetchCFCellMetricsAction(
        this.cfGuid,
        this.cellId,
        new MetricQueryConfig(`${queryString}{bosh_job_id="${this.cellId}"}`, {}),
        queryRange
      ),
    };
  }

  public buildChartConfig(yAxisLabel: string): MetricsLineChartConfig {
    const lineChartConfig = new MetricsLineChartConfig();
    lineChartConfig.xAxisLabel = 'Time';
    lineChartConfig.yAxisLabel = yAxisLabel;
    lineChartConfig.autoScale = false;
    return lineChartConfig;
  }

  private generate(metric: CellMetrics, isMetric: false, customAction?: FetchCFCellMetricsAction): Observable<string>;
  private generate(metric: CellMetrics, isMetric: true, customAction?: FetchCFCellMetricsAction): Observable<IMetricCell>;
  private generate(metric: CellMetrics, isMetric = false, customAction?: FetchCFCellMetricsAction): Observable<string | IMetricCell> {
    const action = customAction || new FetchCFCellMetricsAction(
      this.cfGuid,
      this.cellId,
      new MetricQueryConfig(`${metric}{bosh_job_id="${this.cellId}"}`, {}),
      MetricQueryType.QUERY,
      false
    );
    return this.entityServiceFactory.create<IMetrics<IMetricVectorResult<IMetricCell>>>(
      action.guid,
      action,
    ).waitForEntity$.pipe(
      map(entityInfo => entityInfo.entity),
      map(entity => {
        if (!entity.data || !entity.data.result || !entity.data.result.length) {
          return isMetric ? {} as IMetricCell : '';
        }
        if (isMetric) {
          return entity.data.result[0].metric;
        }
        return entity.data.result[0].value[1];
      })
    );
  }

  private generateUsage(remaining$: Observable<string>, total$: Observable<string>): Observable<string> {
    return combineLatest([remaining$, total$]).pipe(
      map(([remaining, total]) => (Number(total) - Number(remaining)).toString())
    );
  }
}
