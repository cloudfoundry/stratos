import { ChangeDetectionStrategy, AfterContentInit, Component, ContentChild, Input, OnDestroy, OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration } from 'chart.js';
import { Store } from '@ngrx/store';
import {
  MetricsAction,
  EntityMonitor,
  ChartSeries,
  IMetrics,
  MetricResultTypes,
  MetricsFilterSeries,
  AppState,
  EntityMonitorFactory,
} from '@stratosui/store';
import { combineLatest, Observable, Subscription, timer } from 'rxjs';
import { debounce, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';

import { CardWrapperComponent } from '@stratosui/core';
import { MetricsRangeSelectorComponent } from '../metrics-range-selector/metrics-range-selector.component';
import { MetricsChartTypes, MetricsLineChartConfig, YAxisTickFormattingFunc } from './metrics-chart.types';
import { MetricsChartManager } from './metrics.component.manager';

const MAX_SERIES_IN_TOOLTIP = 16;

export interface MetricsConfig<T = any> {
  metricsAction: MetricsAction;
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
  @Input()
  public metricsConfig!: MetricsConfig;
  @Input()
  public chartConfig: MetricsLineChartConfig;
  @Input()
  public title!: string;

  @ContentChild(MetricsRangeSelectorComponent, { static: true })
  public timeRangeSelector: MetricsRangeSelectorComponent;

  @Input()
  set metricsAction(action: MetricsAction) {
    this.commitAction(action);
  }

  public hasMultipleInstances = false;

  public chartTypes = MetricsChartTypes;

  private timeSelectorSub!: Subscription;

  public results$!: Observable<IMetrics<any> | ChartSeries<any>[] | null>;
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

  public metricsMonitor: EntityMonitor<IMetrics>;

  private committedAction!: MetricsAction;

  public isRefreshing$!: Observable<boolean>;
  public isFetching$!: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private entityMonitorFactory: EntityMonitorFactory
  ) { }
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
    if (start && end && step) {
      return MetricsChartManager.fillOutTimeOrderedChartSeries(
        sortedArray,
        start,
        end,
        step,
        this.metricsConfig,
      );
    }
    return sortedArray;
  }

  ngOnInit() {
    this.committedAction = this.metricsConfig.metricsAction;
    this.metricsMonitor = this.entityMonitorFactory.create<IMetrics>(
      this.metricsConfig.metricsAction.guid,
      this.committedAction
    );

    const baseResults$ = this.metricsMonitor.entity$.pipe(
      distinctUntilChanged((oldMetrics, newMetrics) => {
        return oldMetrics && oldMetrics.data === newMetrics.data;
      }),

    );

    this.results$ = baseResults$.pipe(
      map(metrics => {
        if (!metrics) {
          this.chartJsData = { labels: [], datasets: [] };
          return metrics;
        }
        const mapMetricsData = this.mapMetricsToChartData(metrics, this.metricsConfig);
        const metricsArray = this.metricsConfig.filterSeries ? this.metricsConfig.filterSeries(mapMetricsData) : mapMetricsData;
        if (!metricsArray.length) {
          this.chartJsData = { labels: [], datasets: [] };
          return [];
        }

        // Convert to Chart.js format
        this.convertToChartJsData(metricsArray);

        const query = metrics.query;
        const { start, end, step } = query.params as { start: number, end: number, step: number };
        this.hasMultipleInstances = metricsArray.length > 1;
        return this.postFetchMiddleware(metricsArray, [start, end, step]);
      }),
      distinctUntilChanged()
    );

    this.isRefreshing$ = combineLatest(
      this.results$,
      this.metricsMonitor.isFetchingEntity$.pipe(startWith(true))
    ).pipe(
      debounce(([results, fetching]) => {
        return !fetching ? timer(800) : timer(0);
      }),
      map(([results, fetching]) => results && fetching),
      distinctUntilChanged()
    );

    this.isFetching$ = combineLatest(
      this.results$.pipe(startWith(null)),
      this.metricsMonitor.isFetchingEntity$.pipe(startWith(true))
    ).pipe(
      map(([results, fetching]) => !results && fetching),
      distinctUntilChanged(),
      startWith(true),
    );
  }

  ngAfterContentInit() {
    if (this.timeRangeSelector) {
      this.timeRangeSelector.baseAction = this.metricsConfig.metricsAction;
      this.timeSelectorSub = this.timeRangeSelector.metricsAction.subscribe((action: MetricsAction) => {
        this.commitAction(action);
      });
    }
  }

  ngOnDestroy() {
    if (this.timeSelectorSub) {
      this.timeSelectorSub.unsubscribe();
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

  private commitAction(action: MetricsAction) {
    this.committedAction = action;
    this.store.dispatch(action);
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

    // Get all unique timestamps across all series
    const allTimestamps = new Set<number>();
    metricsArray.forEach(series => {
      series.series.forEach(point => {
        const pointTime = point.name instanceof Date ? point.name.getTime() : new Date(point.name).getTime();
        allTimestamps.add(pointTime);
      });
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
    const labels = sortedTimestamps.map(timestamp => new Date(timestamp).toLocaleTimeString());

    // Convert each series to Chart.js dataset
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

    // Update chart options with axis labels
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
