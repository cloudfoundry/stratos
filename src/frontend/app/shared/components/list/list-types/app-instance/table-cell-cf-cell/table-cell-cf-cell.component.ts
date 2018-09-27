import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { IMetricMatrixResult } from '../../../../../../store/types/base-metric.types';
import { IMetricApplication } from '../../../../../../store/types/metric.types';
import { TableCellCustom } from '../../../list.types';
import { ListAppInstance } from '../app-instance-types';

@Component({
  selector: 'app-table-cell-cf-cell-usage',
  templateUrl: './table-cell-cf-cell.component.html',
  styleUrls: ['./table-cell-cf-cell.component.scss']
})
export class TableCellCfCellComponent extends TableCellCustom<ListAppInstance> {

  cellMetric$: Observable<IMetricApplication>;
  cellLink: string;

  @Input('config')
  set config(config: {
    metricResults$: Observable<IMetricMatrixResult<IMetricApplication>[]>
    cfGuid: string
  }) {
    if (!config) {
      return;
    }
    const { metricResults$, cfGuid } = config;

    this.cellMetric$ = metricResults$.pipe(
      filter(metricResults => !!metricResults[this.row.index]),
      map(metricResults => metricResults[this.row.index].metric),
      tap(metric => this.cellLink = `/cloud-foundry/${cfGuid}/cells/${metric.bosh_job_id}/summary`)
    );

  }

}

