import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

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

  cell$: Observable<string>;

  @Input('config')
  set config(config: { metricResults$: Observable<IMetricMatrixResult<IMetricApplication>[]> }) {
    if (!config) {
      return;
    }
    this.cell$ = config.metricResults$.pipe(
      filter(metricResults => !!metricResults[this.row.index]),
      map(metricResults => metricResults[this.row.index].metric.bosh_job_id)
    );
  }

}

