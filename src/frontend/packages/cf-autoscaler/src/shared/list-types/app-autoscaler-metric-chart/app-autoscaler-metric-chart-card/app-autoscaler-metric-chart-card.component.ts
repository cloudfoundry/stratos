import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, Signal, computed, effect, inject, signal } from '@angular/core';
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
  public appAutoscalerAppMetricLegend!: { legendValue: AppAutoscalerMetricDataPoint[], legendColor: unknown[] };

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
