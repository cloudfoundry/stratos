import { AfterContentInit, Component, ContentChild, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription, timer } from 'rxjs';
import { debounce, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { MetricsAction } from '../../../store/actions/metrics.actions';
import { AppState } from '../../../store/app-state';
import { entityFactory, metricSchemaKey } from '../../../store/helpers/entity-factory';
import { EntityMonitor } from '../../monitors/entity-monitor';
import { MetricQueryType } from '../../services/metrics-range-selector.types';
import { MetricsRangeSelectorComponent } from '../metrics-range-selector/metrics-range-selector.component';
import { ChartSeries, IMetrics, MetricResultTypes } from './../../../store/types/base-metric.types';
import { EntityMonitorFactory } from './../../monitors/entity-monitor.factory.service';
import { MetricsChartTypes } from './metrics-chart.types';
import { MetricsChartManager } from './metrics.component.manager';

export interface MetricsConfig<T = any> {
  metricsAction: MetricsAction;
  getSeriesName: (T) => string;
  mapSeriesItemName?: (value) => string | Date;
  mapSeriesItemValue?: (value) => any;
  sort?: (a: ChartSeries<T>, b: ChartSeries<T>) => number;
}
export interface MetricsChartConfig {
  chartType: MetricsChartTypes;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

@Component({
  selector: 'app-metrics-chart',
  templateUrl: './metrics-chart.component.html',
  styleUrls: ['./metrics-chart.component.scss']
})
export class MetricsChartComponent implements OnInit, OnDestroy, AfterContentInit {
  @Input()
  public metricsConfig: MetricsConfig;
  @Input()
  public chartConfig: MetricsChartConfig;
  @Input()
  public title: string;

  @ContentChild(MetricsRangeSelectorComponent)
  public timeRangeSelector: MetricsRangeSelectorComponent;

  @Input()
  set metricsAction(action: MetricsAction) {
    this.commitAction(action);
  }

  public hasMultipleInstances = false;

  public chartTypes = MetricsChartTypes;

  private pollSub: Subscription;

  private timeSelectorSub: Subscription;

  public results$;

  public metricsMonitor: EntityMonitor<IMetrics>;

  private committedAction: MetricsAction;

  public isRefreshing$: Observable<boolean>;
  public isFetching$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private entityMonitorFactory: EntityMonitorFactory
  ) { }

  private postFetchMiddleware(metricsArray: ChartSeries[]) {
    if (this.metricsConfig.sort) {
      const newMetricsArray = [
        ...metricsArray
      ];
      newMetricsArray.sort(this.metricsConfig.sort);
      if (
        this.committedAction.query.params &&
        this.committedAction.query.params.start &&
        this.committedAction.query.params.end
      ) {
        return MetricsChartManager.fillOutTimeOrderedChartSeries(
          newMetricsArray,
          this.committedAction.query.params.start as number,
          this.committedAction.query.params.end as number,
          this.committedAction.query.params.step as number,
          this.metricsConfig,
        );
      }
    }
    return metricsArray;
  }

  ngOnInit() {
    this.committedAction = this.metricsConfig.metricsAction;
    this.metricsMonitor = this.entityMonitorFactory.create<IMetrics>(
      this.metricsConfig.metricsAction.metricId,
      metricSchemaKey,
      entityFactory(metricSchemaKey)
    );

    const baseResults$ = this.metricsMonitor.entity$.pipe(
      distinctUntilChanged((oldMetrics, newMetrics) => {
        return oldMetrics && oldMetrics.data === newMetrics.data;
      })
    );

    this.results$ = baseResults$.pipe(
      map(metrics => {
        const metricsArray = this.mapMetricsToChartData(metrics, this.metricsConfig);
        if (!metricsArray.length) {
          return [];
        }
        this.hasMultipleInstances = metricsArray.length > 1;
        return this.postFetchMiddleware(metricsArray);
      })
    );

    this.isRefreshing$ = combineLatest(
      baseResults$,
      this.metricsMonitor.isFetchingEntity$
    ).pipe(
      debounce(([results, fetching]) => {
        return !fetching ? timer(800) : timer(0);
      }),
      map(([results, fetching]) => results && fetching)
    );

    this.isFetching$ = combineLatest(
      baseResults$.pipe(startWith(null)),
      this.metricsMonitor.isFetchingEntity$
    ).pipe(
      map(([results, fetching]) => !results && fetching)
    );
  }

  ngAfterContentInit() {
    if (this.timeRangeSelector) {
      this.timeRangeSelector.baseAction = this.metricsConfig.metricsAction;
      this.timeSelectorSub = this.timeRangeSelector.metricsAction.subscribe((action) => {
        this.commitAction(action);
      });
    }
  }

  private setup(action: MetricsAction) {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }
    if (action.queryType === MetricQueryType.QUERY) {
      this.pollSub = this.metricsMonitor
        .poll(
          10000,
          () => {
            this.store.dispatch(action);
          },
          request => ({ busy: request.fetching, error: request.error, message: request.message })
        ).subscribe();
    }
  }

  ngOnDestroy() {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }
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
    this.setup(action);
    this.store.dispatch(action);
  }
}
