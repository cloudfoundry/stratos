import { Injectable } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { FetchCFCellMetricsAction, MetricQueryConfig, MetricQueryType } from '../../../../../store/actions/metrics.actions';
import { entityFactory, metricSchemaKey } from '../../../../../store/helpers/entity-factory';
import { IMetrics, IMetricVectorResult } from '../../../../../store/types/base-metric.types';
import { IMetricCell } from '../../../../../store/types/metric.types';
import { ActiveRouteCfCell } from '../../../cf-page.types';

export const enum CellMetrics {
  HEALTHY = 'firehose_value_metric_rep_unhealthy_cell',
  REMAINING_CONTAINERS = 'firehose_value_metric_rep_capacity_remaining_containers',
  REMAINING_DISK = 'firehose_value_metric_rep_capacity_remaining_disk',
  REMAINING_MEMORY = 'firehose_value_metric_rep_capacity_remaining_memory',
  TOTAL_CONTAINERS = 'firehose_value_metric_rep_capacity_total_containers',
  TOTAL_DISK = 'firehose_value_metric_rep_capacity_total_disk',
  TOTAL_MEMORY = 'firehose_value_metric_rep_capacity_total_memory',
  CPUS = 'firehose_value_metric_rep_num_cpus'
}

@Injectable()
export class CloudFoundryCellService {

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
    private entityServiceFactory: EntityServiceFactory) {

    this.cellId = activeRouteCfCell.cellId;
    this.cfGuid = activeRouteCfCell.cfGuid;

    this.healthy$ = this.generate(CellMetrics.HEALTHY);
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

    this.cellMetric$ = this.generate(CellMetrics.HEALTHY, true);

  }


  private generate(metric: CellMetrics, isMetric = false): Observable<any> {
    const action = new FetchCFCellMetricsAction(
      this.cfGuid,
      this.cellId,
      new MetricQueryConfig(metric, { bosh_job_id: this.cellId }),
      MetricQueryType.QUERY
    );
    if (metric === CellMetrics.HEALTHY) {
      this.healthyMetricId = action.metricId;
    }
    return this.entityServiceFactory.create<IMetrics<IMetricVectorResult<IMetricCell>>>(
      metricSchemaKey,
      entityFactory(metricSchemaKey),
      action.metricId,
      action,
      false
    ).waitForEntity$.pipe(
      map(entityInfo => entityInfo.entity),
      map(entity => {
        if (!entity.data || !entity.data.result) {
          return undefined;
        }
        return isMetric ? entity.data.result[0].metric : entity.data.result[0].value[1];
      })
    );
  }

  private generateUsage(remaining$: Observable<string>, total$: Observable<string>): Observable<any> {
    return combineLatest([remaining$, total$]).pipe(
      map(([remaining, total]) => Number(total) - Number(remaining))
    );
  }

}
