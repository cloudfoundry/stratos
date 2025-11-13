import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { ProgressSpinnerComponent } from '../../../../../../../../core/src/shared/components/progress-spinner/progress-spinner.component';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { EntityService } from '../../../../../../../../store/src/entity-service';
import { IMetricMatrixResult, IMetrics } from '../../../../../../../../store/src/types/base-metric.types';
import { IMetricCell } from '../../../../../../../../store/src/types/metric.types';
import { ListAppInstance } from '../app-instance-types';

@Component({
  selector: 'app-table-cell-cf-cell-usage',
  templateUrl: './table-cell-cf-cell.component.html',
  styleUrls: ['./table-cell-cf-cell.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ProgressSpinnerComponent
  ]
})
export class TableCellCfCellComponent extends TableCellCustom<ListAppInstance> implements OnDestroy {

  cellMetric$!: Observable<IMetricCell>;
  cellLink!: string;
  fetchMetricsSub!: Subscription;

  @Input('config')
  set config(config: {
    metricEntityService: EntityService<IMetrics<IMetricMatrixResult<IMetricCell>>>;
    cfGuid: string;
  }) {
    super.config = config;
    if (!config) {
      return;
    }
    const { metricEntityService, cfGuid } = config;

    this.cellMetric$ = metricEntityService.waitForEntity$.pipe(
      filter(entityInfo => !!entityInfo.entity.data && !!entityInfo.entity.data.result),
      map((entityInfo) => {
        const metricResult = entityInfo.entity.data.result.find(res => res.metric.instance_index === this.row.index.toString());
        return metricResult ? metricResult.metric : null;
      }),
      tap(metric => {
        // No metric? It should exists so start polling to ensure we fetch it. It could be missing if the instance was just created
        // and cf hasn't yet emitted metrics for it
        if (!metric && !this.fetchMetricsSub) {
          this.fetchMetricsSub = metricEntityService.poll(5000).subscribe();
        }
      }),
      filter(metric => !!metric),
      tap(metric => {
        this.cellLink = `/cloud-foundry/${cfGuid}/cells/${metric.bosh_job_id}/summary`;
        // If we're polling to get metric then make sure to unsub
        if (this.fetchMetricsSub) {
          this.fetchMetricsSub.unsubscribe();
        }
      })
    );
  }

  ngOnDestroy() {
    if (this.fetchMetricsSub) {
      this.fetchMetricsSub.unsubscribe();
    }
  }

}

