import { IMetricMatrixResult, IMetrics } from './../../../store/types/base-metric.types';
import { map, filter } from 'rxjs/operators';
import { metricSchema } from './../../../store/actions/metrics.actions';
import { EntityMonitorFactory } from './../../monitors/entity-monitor.factory.service';
import { Component, OnInit, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { MetricsAction, FetchApplicationMetricsAction } from '../../../store/actions/metrics.actions';
import { ApplicationService } from '../../../features/applications/application.service';
export interface MetricsChartConfig<T = any> {
  getSeriesName: (T) => string;
  metricsAction: MetricsAction;
  xAxisLabel?: string;
  yAxisLabel?: string;
}
@Component({
  selector: 'app-metrics-chart',
  templateUrl: './metrics-chart.component.html',
  styleUrls: ['./metrics-chart.component.scss']
})
export class MetricsChartComponent implements OnInit {
  public results$;
  @Input('config')
  public config: MetricsChartConfig;
  constructor(
    private store: Store<AppState>,
    private entityMonitorFactory: EntityMonitorFactory,
    private appService: ApplicationService
  ) {

  }

  ngOnInit() {
    this.store.dispatch(this.config.metricsAction);
    const metrics$ = this.entityMonitorFactory.create<IMetrics>(
      this.config.metricsAction.metricId,
      metricSchema.key,
      metricSchema
    )
    this.results$ = metrics$.entity$.pipe(
      filter(metrics => !!metrics),
      map(metrics => {
        debugger;
        return metrics.result.map(
          val => ({
            name: this.config.getSeriesName(val),
            series: val.values.map(val => ({
              name: new Date(parseInt(val[0])),
              value: val[1]
            }))
          })
        )
      })
    )
  }

}
