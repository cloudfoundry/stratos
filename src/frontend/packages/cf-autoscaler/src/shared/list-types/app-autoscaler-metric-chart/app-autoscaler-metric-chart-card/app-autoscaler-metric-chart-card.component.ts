import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, Signal, computed, effect, inject, signal } from '@angular/core';
import { ChartConfiguration, TooltipItem } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { ApplicationService } from '../../../../../../cloud-foundry/src/features/applications/application.service';
import { CardCell } from '../../../../../../core/src/shared/components/signal-list/cell-base';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { AutoscalerConstants, buildLegendData } from '../../../../core/autoscaler-helpers/autoscaler-util';
import { buildMetricData } from '../../../../core/autoscaler-helpers/autoscaler-transform-metric';
import {
  AutoscalerMetricDataService,
  AutoscalerMetricQueryParams,
} from '../../../../services/domain-data/autoscaler-metric-data.service';
import {
  AppAutoscalerMetricDataLocal,
  AppAutoscalerMetricDataPoint,
  AppAutoscalerMetricLegend,
  AppScalingTrigger,
} from '../../../../store/app-autoscaler.types';
import { AppAutoscalerComboChartComponent } from './combo-chart/combo-chart.component';


@Component({
  selector: 'app-app-autoscaler-metric-chart-card',
  templateUrl: './app-autoscaler-metric-chart-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    AppAutoscalerComboChartComponent
  ]
})

export class AppAutoscalerMetricChartCardComponent extends CardCell<APIResource<AppScalingTrigger>> {
  private appService = inject(ApplicationService);
  private metricService = inject(AutoscalerMetricDataService);

  static columns = 1;

  envVarUrl!: string;

  comboBarScheme = {
    name: 'singleLightBlue',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b']
  };
  lineChartScheme = {
    name: 'coolthree',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b']
  };

  public paramsMetricsEnd: number = (new Date()).getTime();
  public paramsMetricsStart: number = this.paramsMetricsEnd - 30 * 60 * 1000;
  public paramsMetrics: AutoscalerMetricQueryParams = {
    'start-time': this.paramsMetricsStart + '000000',
    'end-time': this.paramsMetricsEnd + '000000',
    page: '1',
    'results-per-page': '10000000',
    'order-direction': 'asc'
  };

  public metricType!: string;

  // Signal-native row binding. The legacy component computed
  // `metricData$` as an Observable wired to the @ngrx store; we now
  // recompute the formatted metric local form from the signal-native
  // AutoscalerMetricDataService whenever the row binding settles and
  // the underlying metrics signal changes.
  private rowSignal = signal<APIResource<AppScalingTrigger> | null>(null);
  private currentTrigger = signal<AppScalingTrigger | null>(null);

  public metricData!: Signal<APIResource<AppAutoscalerMetricDataLocal>[] | null>;
  public appAutoscalerAppMetricLegend!: { legendValue: AppAutoscalerMetricDataPoint[], legendColor: AppAutoscalerMetricLegend[] };

  // Doughnut gauge showing the latest metric reading against the chart
  // maximum, coloured by trigger state — the same fields the legacy
  // ngx-charts gauge bound (latest.target / latest.colorTarget /
  // chartMaxValue / unit).
  public gaugeData!: Signal<ChartConfiguration<'doughnut'>['data']>;
  public gaugeOptions!: Signal<ChartConfiguration<'doughnut'>['options']>;

  constructor() {
    super();
    // Recompute the formatted chart-shape from the data service's raw
    // resources whenever the row settles or new metrics arrive.
    this.metricData = computed(() => {
      const row = this.rowSignal();
      const trigger = this.currentTrigger();
      if (!row || !trigger || !this.metricType) {
        return null;
      }
      const raw = this.metricService.metrics(
        this.appService.cfGuid,
        this.appService.appGuid,
        this.metricType,
      )();
      const local = buildMetricData(
        this.metricType,
        { resources: raw, total_results: raw.length, total_pages: 1, prev_url: '', next_url: '' },
        parseInt(this.paramsMetrics['start-time'] ?? '0', 10),
        parseInt(this.paramsMetrics['end-time'] ?? '0', 10),
        false,
        trigger,
      );
      return [{
        entity: local,
        metadata: row.metadata,
      }];
    });

    this.gaugeData = computed(() => {
      const entity = this.metricData()?.[0]?.entity;
      if (!entity) {
        return { labels: [], datasets: [] };
      }
      const value = Number(entity.latest.target[0]?.value ?? 0);
      const color = String(entity.latest.colorTarget[0]?.value ?? 'rgba(0,0,0,0.2)');
      return {
        labels: [this.metricType, ''],
        datasets: [{
          data: [value, Math.max(entity.chartMaxValue - value, 0)],
          backgroundColor: [color, 'rgba(0, 0, 0, 0.1)'],
          borderWidth: 0,
        }],
      };
    });

    this.gaugeOptions = computed(() => {
      const unit = this.metricData()?.[0]?.entity?.unit ?? '';
      return {
        // Fixed-size gauge (canvas width/height attributes), matching the
        // legacy 200x200 gauge.
        responsive: false,
        // Legacy gauge geometry: a 240-degree arc starting at -120 degrees.
        rotation: -120,
        circumference: 240,
        cutout: '70%',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            // Only the value slice is meaningful; hide the filler slice.
            filter: (item: TooltipItem<'doughnut'>) => item.dataIndex === 0,
            callbacks: {
              label: (item: TooltipItem<'doughnut'>) => unit ? `${item.parsed} ${unit}` : `${item.parsed}`,
            },
          },
        },
      };
    });

    // Whenever the row binding settles, fire the load() against the
    // data service. Effect runs in injection context (constructor)
    // satisfying Angular's signal-effect requirement.
    effect(() => {
      const row = this.rowSignal();
      if (!row || !row.entity || !row.entity.query || !row.entity.query.params) {
        return;
      }
      void this.metricService.load(
        this.appService.cfGuid,
        this.appService.appGuid,
        this.metricType,
        this.paramsMetrics,
      );
    });
  }

  @Input()
  set row(row: APIResource<AppScalingTrigger>) {
    super.row = row;
    if (row && row.entity && row.entity.query && row.entity.query.params) {
      this.paramsMetricsStart = row.entity.query.params.start * 1000;
      this.paramsMetricsEnd = row.entity.query.params.end * 1000;
      this.paramsMetrics = {
        ...this.paramsMetrics,
        'start-time': this.paramsMetricsStart + '000000',
        'end-time': this.paramsMetricsEnd + '000000',
      };
      this.appAutoscalerAppMetricLegend = this.getLegend2(row.entity);
      this.metricType = AutoscalerConstants.getMetricFromMetricId(row.metadata.guid);
      this.currentTrigger.set(row.entity);
    }
    this.rowSignal.set(row);
  }

  getLegend2(trigger: AppScalingTrigger) {
    const legendColor = buildLegendData(trigger);
    const legendValue: AppAutoscalerMetricDataPoint[] = [];
    legendColor.map((item) => {
      legendValue.push({
        name: item.name,
        value: 1
      });
    });
    return {
      legendValue,
      legendColor
    };
  }
}
