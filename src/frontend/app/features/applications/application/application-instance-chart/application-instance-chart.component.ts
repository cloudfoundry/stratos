import { Component, OnInit, Input } from '@angular/core';
import { MetricsLineChartConfig } from '../../../../shared/components/metrics-chart/metrics-chart.types';
import { MetricsConfig } from '../../../../shared/components/metrics-chart/metrics-chart.component';
import { IMetricMatrixResult } from '../../../../store/types/base-metric.types';
import { FetchApplicationMetricsAction } from '../../../../store/actions/metrics.actions';

@Component({
  selector: 'app-application-instance-chart',
  templateUrl: './application-instance-chart.component.html',
  styleUrls: ['./application-instance-chart.component.scss']
})
export class ApplicationInstanceChartComponent implements OnInit {

  @Input('appGuid')
  private appGuid: string;

  @Input('endpointGuid')
  private endpointGuid: string;

  constructor() { }

  private buildChartConfig() {
    const lineChartConfig = new MetricsLineChartConfig();
    lineChartConfig.xAxisLabel = 'Time';
    lineChartConfig.yAxisLabel = 'CPU usage %';
    return lineChartConfig;
  }

  public instanceChartConfig = this.buildChartConfig();

  public instanceMetricConfig: MetricsConfig<IMetricMatrixResult<IMetricApplication>>

  ngOnInit() {
    this.instanceMetricConfig = {
      getSeriesName: result => `Instance ${result.metric.instance_index}`,
      metricsAction: new FetchApplicationMetricsAction(
        this.appGuid,
        this.endpointGuid,
        'firehose_container_metric_cpu_percentage{}[1h]'
      ),
    };
  }

}
