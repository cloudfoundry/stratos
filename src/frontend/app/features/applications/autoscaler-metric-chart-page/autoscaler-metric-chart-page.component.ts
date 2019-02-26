import { Component, OnDestroy, OnInit } from '@angular/core';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { SetCFDetails, SetNewAppName } from '../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../store/app-state';
import { ApplicationService } from '../application.service';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey,
} from '../../../store/helpers/entity-factory';
import { GetAppAutoscalerPolicyAction } from '../../../store/actions/app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../../../store/types/app-autoscaler.types';
import {
  GetAppAutoscalerAppMetricAction,
} from '../../../store/actions/app-autoscaler.actions';
import {
  AppAutoscalerAppMetric,
} from '../../../store/types/app-autoscaler.types';
import {
  appAutoscalerAppMetricSchemaKey,
} from '../../../store/helpers/entity-factory';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { normalColor } from '../../../store/helpers/autoscaler-helpers';

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

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {
  }

  private app: any = {
    entity: {}
  };

  private sub: Subscription;

  appAutoscalerPolicyService: EntityService;
  public appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  clearSub() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined;
    }
  }

  ngOnInit() {
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
          this.appAutoscalerAppMetricNames = Object.keys(entity.entity.scaling_rules_map);
          this.loadLatestMetricsUponPolicy(entity);
        }
        return entity && entity.entity;
      })
    );
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
        this.appAutoscalerAppMetricLegend[metricName] = this.getLegend(policyEntity.entity.scaling_rules_map[metricName]);
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

  getLegend(trigger) {
    const legendValue = [];
    const legendColor = [];
    for (let i = 0; trigger.upper && trigger.upper.length > 0 && i < trigger.upper.length; i++) {
      const current = trigger.upper[i];
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
    legendValue.push({
      name: 'ideal state',
      value: 1
    });
    legendColor.push({
      name: 'ideal state',
      value: normalColor
    });

    for (let i = 0; trigger.lower && trigger.lower.length > 0 && i < trigger.lower.length; i++) {
      const current = trigger.lower[i];
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
    return {
      legendValue,
      legendColor
    };
  }

}
