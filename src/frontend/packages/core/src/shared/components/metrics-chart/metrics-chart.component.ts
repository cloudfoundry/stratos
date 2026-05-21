import { ChangeDetectionStrategy, AfterContentInit, Component, ContentChild, Input, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ChartConfiguration } from 'chart.js';
import {
  ChartSeries,
  IMetrics,
  MetricResultTypes,
  MetricsDataService,
  MetricsFilterSeries,
  MetricsObservation,
  MetricsRequest,
} from '@stratosui/store';
import { BaseChartDirective } from 'ng2-charts';

import { CardWrapperComponent } from '../cards/card/card.component';
import { MetricsRangeSelectorComponent } from '../metrics-range-selector/metrics-range-selector.component';
import { MetricsChartTypes, MetricsLineChartConfig, YAxisTickFormattingFunc } from './metrics-chart.types';
import { MetricsChartManager } from './metrics.component.manager';

const MAX_SERIES_IN_TOOLTIP = 16;

export interface MetricsConfig<T = any> {
  request: MetricsRequest;
  getSeriesName: (item: T) => string;
  mapSeriesItemName?: (value: any) => string | Date;
  mapSeriesItemValue?: (value: any) => any;
  filterSeries?: MetricsFilterSeries;
  sort?: (a: ChartSeries<T>, b: ChartSeries<T>) => number;
  tooltipValueFormatter?: YAxisTickFormattingFunc;
}

@Component({
  selector: 'app-metrics-chart',
  templateUrl: './metrics-chart.component.html',
  styleUrls: ['./metrics-chart.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    CardWrapperComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsChartComponent implements OnInit, OnDestroy, AfterContentInit {
  private metricsDataService = inject(MetricsDataService);

  @Input()
  public metricsConfig!: MetricsConfig;
  @Input()
  public chartConfig: MetricsLineChartConfig;
  @Input()
  public title!: string;

  @ContentChild(MetricsRangeSelectorComponent, { static: true })
  public timeRangeSelector: MetricsRangeSelectorComponent;

  public hasMultipleInstances = false;

  public chartTypes = MetricsChartTypes;

  // Writable signal that drives MetricsDataService.observe(). Range
  // selector (or parent range selector) writes here; chart re-fetches.
  private readonly requestSignal = signal<MetricsRequest | null>(null);

  // Read-only accessor for the parent range selector — used to merge
  // new query params into each child chart's current request.
  public get currentRequest(): MetricsRequest {
    return this.requestSignal();
  }

  public applyRequest(req: MetricsRequest) {
    this.requestSignal.set(req);
  }

  private observation!: MetricsObservation;

  public results = computed<ChartSeries<any>[] | null>(() => {
    const metrics = this.observation?.metrics();
    if (!metrics) {
      return null;
    }
    const mapped = this.mapMetricsToChartData(metrics, this.metricsConfig);
    const filtered = this.metricsConfig.filterSeries ? this.metricsConfig.filterSeries(mapped) : mapped;
    if (!filtered.length) {
      return [];
    }
    const { start, end, step } = (metrics.query.params || {}) as { start: number, end: number, step: number };
    this.hasMultipleInstances = filtered.length > 1;
    return this.postFetchMiddleware(filtered, [start, end, step]);
  });

  public hasResults = computed(() => {
    const r = this.results();
    return !!r && r.length > 0;
  });

  public isFetching = computed(() => this.observation ? this.observation.fetching() && !this.observation.metrics() : true);
  public isRefreshing = computed(() => this.observation ? this.observation.fetching() && !!this.observation.metrics() : false);

  public chartJsData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: ''
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: ''
        }
      }
    },
    plugins: {
      legend: {
        display: true
      }
    }
  };

  private sort(metricsArray: ChartSeries[]) {
    if (this.metricsConfig.sort) {
      const newMetricsArray = [
        ...metricsArray
      ];
      return newMetricsArray.sort(this.metricsConfig.sort);
    }
    return metricsArray;
  }
  private postFetchMiddleware(metricsArray: ChartSeries[], params: [number, number, number]) {
    const [start, end, step] = params;
    const sortedArray = this.sort(metricsArray);
    let result = sortedArray;
    if (start && end && step) {
      result = MetricsChartManager.fillOutTimeOrderedChartSeries(
        sortedArray,
        start,
        end,
        step,
        this.metricsConfig,
      );
    }
    this.convertToChartJsData(result);
    return result;
  }

  ngOnInit() {
    this.requestSignal.set(this.metricsConfig.request);
    this.observation = this.metricsDataService.observe(this.requestSignal);
  }

  ngAfterContentInit() {
    if (this.timeRangeSelector) {
      this.timeRangeSelector.baseRequest = this.metricsConfig.request;
      this.timeRangeSelector.request.pipe(takeUntilDestroyed()).subscribe((req: MetricsRequest) => {
        this.requestSignal.set(req);
      });
    }
  }

  ngOnDestroy() {
    if (this.observation) {
      this.observation.stop();
    }
  }

  private mapMetricsToChartData(metrics: IMetrics, metricsConfig: MetricsConfig) {
    if (metrics && metrics.data) {
      switch (metrics.data.resultType) {
        case MetricResultTypes.MATRIX:
          return MetricsChartManager.mapMatrix(metrics.data, metricsConfig);
        case MetricResultTypes.VECTOR:
          return MetricsChartManager.mapVector(metrics.data, metricsConfig);
        case MetricResultTypes.SCALAR:
        case MetricResultTypes.STRING:
        default:
          throw new Error(`Could not find chart data mapper for metrics type ${metrics.data.resultType}`);
      }
    } else {
      return [];
    }
  }

  public getTooltipName(model: { name: { toLocaleString: () => any; }; }) {
    return model.name.toLocaleString();
  }

  public getTooltipValue(model: { value: string; }) {
    return this.metricsConfig.tooltipValueFormatter ? this.metricsConfig.tooltipValueFormatter(model.value) : model.value;
  }

  public getSeriesTooltipModel(model: any) {
    if (model.length <= MAX_SERIES_IN_TOOLTIP) {
      return model;
    }

    const truncated = model.slice(0, MAX_SERIES_IN_TOOLTIP);
    truncated.push({truncated: true});
    return truncated;
  }

  private convertToChartJsData(metricsArray: ChartSeries<any>[]) {
    if (!metricsArray || !metricsArray.length) {
      this.chartJsData = { labels: [], datasets: [] };
      return;
    }

    const allTimestamps = new Set<number>();
    metricsArray.forEach(series => {
      series.series.forEach(point => {
        const pointTime = point.name instanceof Date ? point.name.getTime() : new Date(point.name).getTime();
        allTimestamps.add(pointTime);
      });
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
    const labels = sortedTimestamps.map(timestamp => new Date(timestamp).toLocaleTimeString());

    const datasets = metricsArray.map((series, index) => {
      const data = sortedTimestamps.map(timestamp => {
        const point = series.series.find(p => {
          const pointTime = p.name instanceof Date ? p.name.getTime() : new Date(p.name).getTime();
          return pointTime === timestamp;
        });
        return point ? point.value : null;
      });

      const colors = ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD'];

      return {
        label: series.name,
        data: data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        fill: false,
        tension: 0.1
      };
    });

    this.chartJsData = { labels, datasets };

    if (this.chartConfig && this.chartOptions?.scales) {
      if (this.chartOptions.scales.x && 'title' in this.chartOptions.scales.x && this.chartOptions.scales.x.title) {
        this.chartOptions.scales.x.title.text = this.chartConfig.xAxisLabel || '';
      }
      if (this.chartOptions.scales.y && 'title' in this.chartOptions.scales.y && this.chartOptions.scales.y.title) {
        this.chartOptions.scales.y.title.text = this.chartConfig.yAxisLabel || '';
      }
    }
  }
}
