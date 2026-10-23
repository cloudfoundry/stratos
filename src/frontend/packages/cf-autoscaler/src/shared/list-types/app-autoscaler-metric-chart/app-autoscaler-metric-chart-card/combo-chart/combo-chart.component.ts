import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Output, ViewEncapsulation, OnChanges, inject, input } from '@angular/core';
import { ChartConfiguration, ChartEvent } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import {
  AppAutoscalerMetricDataLine,
  AppAutoscalerMetricDataPoint,
  AppAutoscalerMetricLegend,
} from '../../../../../store/app-autoscaler.types';

@Component({
  selector: 'app-autoscaler-combo-chart-component',
  templateUrl: './combo-chart.component.html',
  styleUrls: ['./combo-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    BaseChartDirective,
  ]
})
export class AppAutoscalerComboChartComponent implements OnChanges {
  private cdr = inject(ChangeDetectorRef);


  readonly width = input(400);
  readonly height = input(300);
  readonly legend = input(false);
  readonly xAxis = input(false);
  readonly yAxis = input(false);
  readonly showXAxisLabel = input(false);
  readonly showYAxisLabel = input(false);
  readonly showGridLines = input(true);
  readonly tooltipDisabled = input(false);
  readonly animations = input(true);
  readonly xAxisLabel = input.required<string>();
  readonly yAxisLabel = input.required<string>();
  // Name of the metric series; used as the bar dataset label (tooltips).
  readonly metricName = input.required<string>();
  // Ensure the y axis extends at least this far, so trigger thresholds
  // near the top of the range stay visible.
  readonly yScaleMax = input<number>();
  // Flat time-bucket points — one bar per point.
  readonly results = input<AppAutoscalerMetricDataPoint[]>([]);
  // Trigger threshold mark-lines: one flat line series per scaling rule.
  readonly lineChart = input<AppAutoscalerMetricDataLine[]>([]);
  // Colour overrides matched by name: time-bucket names for the bars plus
  // trigger names for the threshold lines (see buildMetricColorData).
  readonly customColors = input<AppAutoscalerMetricDataPoint[]>([]);
  // Informational legend entries (trigger threshold ranges) shown instead
  // of the dataset labels, matching the legacy custom legend.
  readonly legendData = input<AppAutoscalerMetricLegend[]>([]);
  readonly colorSchemeLine = input<any>();
  readonly scheme = input<any>();

  // eslint-disable-next-line @angular-eslint/no-output-native -- intentional ngx-charts API parity: re-emits the wrapped chart's (select) event under the same name
  @Output() select = new EventEmitter();
  @Output() activate = new EventEmitter();
  @Output() deactivate = new EventEmitter();

  public comboChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public comboChartOptions: ChartConfiguration['options'] = this.buildOptions();

  ngOnChanges() {
    this.updateChartData();
    this.cdr.markForCheck();
  }

  private updateChartData() {
    const results = this.results() ?? [];
    const lines = this.lineChart() ?? [];
    const colorByName = new Map<string, string>((this.customColors() ?? []).map(item => [item.name, String(item.value)]));

    // Bars: one per pre-formatted time bucket, coloured by trigger state.
    const barFallback: string = this.scheme()?.domain?.[0] ?? '#01579b';
    const datasets: ChartConfiguration['data']['datasets'] = [{
      type: 'bar',
      label: this.metricName(),
      data: results.map(point => Number(point.value)),
      backgroundColor: results.map(point => colorByName.get(point.name) || barFallback),
      yAxisID: 'y',
    }];

    // Threshold mark-lines share the bars' unit and scale, so they render
    // on the same axis; colours come from the trigger colour map.
    const lineFallback: string[] = this.colorSchemeLine()?.domain ?? ['#01579b'];
    lines.forEach((series, index) => {
      const color = colorByName.get(series.name) || lineFallback[index % lineFallback.length];
      datasets.push({
        type: 'line',
        label: series.name,
        data: series.series.map(point => Number(point.value)),
        borderColor: color,
        backgroundColor: color,
        fill: false,
        pointRadius: 0,
        tension: 0,
        yAxisID: 'y',
      });
    });

    this.comboChartData = {
      labels: results.map(point => point.name),
      datasets,
    };
    this.comboChartOptions = this.buildOptions();
  }

  private buildOptions(): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: this.animations() ? undefined : false,
      interaction: {
        intersect: false,
      },
      scales: {
        x: {
          display: this.xAxis(),
          grid: {
            display: false,
          },
          title: {
            display: this.showXAxisLabel() && !!this.xAxisLabel(),
            text: this.xAxisLabel() ?? '',
          },
        },
        y: {
          type: 'linear',
          display: this.yAxis(),
          position: 'left',
          beginAtZero: true,
          suggestedMax: this.yScaleMax(),
          grid: {
            display: this.showGridLines(),
          },
          title: {
            display: this.showYAxisLabel() && !!this.yAxisLabel(),
            text: this.yAxisLabel() ?? '',
          },
        },
      },
      plugins: {
        legend: {
          display: this.legend(),
          // The legend lists trigger threshold ranges (informational),
          // not toggleable datasets — mirror the legacy custom legend.
          ...(this.legendData()?.length ? {
            onClick: () => { /* informational entries — nothing to toggle */ },
            labels: {
              generateLabels: () => this.legendData().map(item => ({
                text: item.name,
                fillStyle: item.value,
                strokeStyle: item.value,
                lineWidth: 0,
              })),
            },
          } : {}),
        },
        tooltip: {
          enabled: !this.tooltipDisabled(),
        },
      },
    };
  }

  onChartClick(event: ChartEvent | undefined, active: object[] | undefined) {
    this.select.emit({ event, active });
  }

  onChartHover(event: ChartEvent, active: object[]) {
    this.activate.emit({ event, active });
  }
}
