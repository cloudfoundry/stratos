import { Component, OnDestroy, OnInit, NgZone, ContentChild, Input } from '@angular/core';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { SetCFDetails, SetNewAppName } from '../../../../../store/src/actions/create-applications-page.actions';
import { AppState } from '../../../../../store/src/app-state';
import { ApplicationService } from '../application.service';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey,
} from '../../../../../store/src/helpers/entity-factory';
import { GetAppAutoscalerPolicyAction } from '../../../../../store/src/actions/app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../../../../../store/src/types/app-autoscaler.types';
import {
  GetAppAutoscalerAppMetricAction,
} from '../../../../../store/src/actions/app-autoscaler.actions';
import {
  AppAutoscalerAppMetric,
} from '../../../../../store/src/types/app-autoscaler.types';
import {
  appAutoscalerAppMetricSchemaKey,
} from '../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { normalColor, buildLegendData } from '../../../../../store/src/helpers/autoscaler-helpers';
import { MetricsAction } from '../../../../../store/src/actions/metrics.actions';
import { ChartSeries, MetricsFilterSeries } from './../../../../../store/src/types/base-metric.types';

export interface MetricsConfig<T = any> {
  metricsAction: MetricsAction;
  getSeriesName: (T) => string;
  mapSeriesItemName?: (value) => string | Date;
  mapSeriesItemValue?: (value) => any;
  filterSeries?: MetricsFilterSeries;
  sort?: (a: ChartSeries<T>, b: ChartSeries<T>) => number;
}

const monthName = new Intl.DateTimeFormat('en-us', { month: 'short' });
const weekdayName = new Intl.DateTimeFormat('en-us', { weekday: 'short' });
function formatLabel(label: any): string {
  if (label instanceof Date) {
    label = label.toLocaleDateString();
  } else {
    label = label.toLocaleString();
  }
  return label;
}

@Component({
  selector: 'app-autoscaler-metric-chart-page',
  templateUrl: './autoscaler-metric-chart-page.component.html',
  styleUrls: ['./autoscaler-metric-chart-page.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class AutoscalerMetricChartPageComponent implements OnInit, OnDestroy {
  @Input()
  public metricsConfig: MetricsConfig;

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/auto-scaler`;
  current = (new Date()).getTime();
  paramsMetrics = {
    'start-time': this.current - 30 * 60 * 1000 + '000000',
    'end-time': this.current + '000000',
    'page': '1',
    'results-per-page': '10000000',
    'order': 'asc'
  };

  appAutoscalerAppMetrics = {};
  appAutoscalerAppMetricNames = [];
  appAutoscalerAppMetricLegend = {};

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

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private ngZone: NgZone,
  ) {
  }

  private app: any = {
    entity: {}
  };

  private sub: Subscription;

  appAutoscalerPolicyService: EntityService;
  public appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  entityServiceAppRefresh$: Subscription;

  private refreshTime = 0;
  private refreshInterval = 60000;
  private autoRefreshString = 'auto-refresh';

  clearSub() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined;
    }
  }

  ngOnInit() {
    this.appAutoscalerPolicyService = this.entityServiceFactory.create(
      appAutoscalerPolicySchemaKey,
      entityFactory(appAutoscalerPolicySchemaKey),
      this.applicationService.appGuid,
      new GetAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid),
      false
    );
    this.appAutoscalerPolicy$ = this.appAutoscalerPolicyService.entityObs$.pipe(
      map(({ entity }) => {
        if (entity && entity.entity) {
          const current = (new Date()).getTime();
          if (this.refreshTime === 0 || current - this.refreshTime > 0.5 * this.refreshInterval) {
            this.refreshTime = current;
            this.appAutoscalerAppMetricNames = Object.keys(entity.entity.scaling_rules_map);
            this.loadLatestMetricsUponPolicy(entity);
          }
        }
        return entity && entity.entity;
      })
    );
    this.ngZone.runOutsideAngular(() => {
      this.entityServiceAppRefresh$ = this.appAutoscalerPolicyService
        .poll(this.refreshInterval, this.autoRefreshString).pipe(
          tap(() => { }))
        .subscribe();
    });

    this.sub = this.applicationService.application$.pipe(
      filter(app => !!app.app.entity),
      take(1),
      map(app => app.app.entity)
    ).subscribe(app => {
      this.app = app;
      this.store.dispatch(new SetCFDetails({
        cloudFoundry: this.applicationService.cfGuid,
        org: '',
        space: this.app.space_guid,
      }));
      this.store.dispatch(new SetNewAppName(this.app.name));
      // Don't want the values to change while the user is editing
      this.clearSub();
    });
  }

  ngOnDestroy(): void {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
    this.clearSub();
  }

  select(data) {
  }

  getAppMetric(metricName: string, trigger: any, params: any) {
    const action = new GetAppAutoscalerAppMetricAction(this.applicationService.appGuid,
      this.applicationService.cfGuid, metricName, false, trigger, params);
    this.store.dispatch(action);
    return getPaginationObservables<AppAutoscalerAppMetric>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(appAutoscalerAppMetricSchemaKey)
      )
    }, false).entities$;
  }

  loadLatestMetricsUponPolicy(policyEntity) {
    if (policyEntity && policyEntity.entity && policyEntity.entity.scaling_rules_map) {
      this.appAutoscalerAppMetrics = {};
      Object.keys(policyEntity.entity.scaling_rules_map).map((metricName) => {
        this.appAutoscalerAppMetricLegend[metricName] = this.getLegend2(policyEntity.entity.scaling_rules_map[metricName]);
        this.appAutoscalerAppMetrics[metricName] =
          this.getAppMetric(metricName, policyEntity.entity.scaling_rules_map[metricName], this.paramsMetrics);
      });
    }
  }

  pieTooltipText({ data }) {
    const label = formatLabel(data.name);
    const val = formatLabel(data.value);
    return `
      <span class="tooltip-label">${label}</span>
      <span class="tooltip-val">$${val}</span>
    `;
  }

  getLegend2(trigger) {
    const legendColor = buildLegendData(trigger);
    const legendValue = [];
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

  getLegend(trigger) {
    const legendValue = [];
    const legendColor = [];
    if (trigger.upper) {
      this.buildSingleLegend(legendValue, legendColor, trigger.upper);
    }
    legendValue.push({
      name: 'ideal state',
      value: 1
    });
    legendColor.push({
      name: 'ideal state',
      value: normalColor
    });
    if (trigger.lower) {
      this.buildSingleLegend(legendValue, legendColor, trigger.lower);
    }
    return {
      legendValue,
      legendColor
    };
  }

  updateSingleLineChartScheme(colors, ul) {
    ul.map((item) => {
      colors.push(item.color);
    });
  }

  buildSingleLegend(legendValue, legendColor, ul) {
    for (let i = 0; i < ul.length; i++) {
      const current = ul[i];
      const name = `${current.adjustment} if ${current.metric_type} ${current.operator} ${current.threshold}`;
      legendValue.push({
        name,
        value: 1
      });
      legendColor.push({
        name,
        value: current.color
      });
    }
  }

  yLeftTickFormat(data) {
    return `${data.toLocaleString()}`;
  }

  yRightTickFormat(data) {
    return `${data}%`;
  }

  yLeftAxisScale(min, max) {
    return { min: `${min}`, max: `${max}` };
  }

}
