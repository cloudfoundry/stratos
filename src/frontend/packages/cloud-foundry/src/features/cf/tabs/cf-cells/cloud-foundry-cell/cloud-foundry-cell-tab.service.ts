import { Injectable } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { MetricsConfig } from '../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.types';
import {
  MetricsChartHelpers,
} from '../../../../../../../core/src/shared/components/metrics-chart/metrics.component.helpers';
import { MetricQueryConfig } from '../../../../../../../store/src/actions/metrics.actions';
import { EntityServiceFactory } from '../../../../../../../store/src/entity-service-factory.service';
import { IMetricMatrixResult, IMetrics, IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import { IMetricCell, MetricQueryType } from '../../../../../../../store/src/types/metric.types';
import { FetchCFCellMetricsAction } from '../../../../../actions/cf-metrics.actions';
import { CellMetrics, CfCellService } from '../../../../container-orchestration/services/cf-cell.service';
import { ActiveRouteCfCell } from '../../../cf-page.types';


/**
 * Designed to be used once drilled down to a cell (see ActiveRouteCfCell)
 */
@Injectable()
export class CloudFoundryCellTabService {

  cfGuid: string;
  cellId: string;
  cellMetric$: Observable<IMetricCell>;

  healthy$: Observable<string>;
  healthyMetricId: string;
  cpus$: Observable<string>;

  usageContainers$: Observable<string>;
  remainingContainers$: Observable<string>;
  totalContainers$: Observable<string>;

  usageDisk$: Observable<string>;
  remainingDisk$: Observable<string>;
  totalDisk$: Observable<string>;

  usageMemory$: Observable<string>;
  remainingMemory$: Observable<string>;
  totalMemory$: Observable<string>;

  constructor(
    activeRouteCfCell: ActiveRouteCfCell,
    private entityServiceFactory: EntityServiceFactory,
    cfCellService: CfCellService
  ) {

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

    const action$ = cfCellService.createCellMetricAction(this.cfGuid);
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
    mapSeriesItemValue?: (value) => any): MetricsConfig<IMetricMatrixResult<IMetricCell>> {
    return {
      getSeriesName: (result: IMetricMatrixResult<IMetricCell>) => `Cell ${result.metric.bosh_job_id}`,
      mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
      mapSeriesItemValue,
      metricsAction: new FetchCFCellMetricsAction(
        this.cfGuid,
        this.cellId,
        new MetricQueryConfig(queryString + `{bosh_job_id="${this.cellId}"}`, {}),
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

  private generate(metric: CellMetrics, isMetric = false, customAction?: FetchCFCellMetricsAction): Observable<any> {
    const action = customAction || new FetchCFCellMetricsAction(
      this.cfGuid,
      this.cellId,
      new MetricQueryConfig(metric + `{bosh_job_id="${this.cellId}"}`, {}),
      MetricQueryType.QUERY,
      false
    );
    return this.entityServiceFactory.create<IMetrics<IMetricVectorResult<IMetricCell>>>(
      action.guid,
      action,
    ).waitForEntity$.pipe(
      map(entityInfo => entityInfo.entity),
      map(entity => {
        if (!entity.data || !entity.data.result) {
          return null;
        }
        if (isMetric) {
          return entity.data.result[0].metric;
        }
        const res = entity.data.result;
        return res && res.length ? entity.data.result[0].value[1] : null;
      })
    );
  }

  private generateUsage(remaining$: Observable<string>, total$: Observable<string>): Observable<any> {
    return combineLatest([remaining$, total$]).pipe(
      map(([remaining, total]) => Number(total) - Number(remaining))
    );
  }
}
