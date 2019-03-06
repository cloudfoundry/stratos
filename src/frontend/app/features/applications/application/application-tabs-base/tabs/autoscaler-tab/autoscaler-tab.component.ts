import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { EntityService } from '../../../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey,
  appAutoscalerScalingHistorySchemaKey,
  appAutoscalerAppMetricSchemaKey,
  appAutoscalerInsMetricSchemaKey,
} from '../../../../../../store/helpers/entity-factory';
import { ApplicationService } from '../../../../application.service';
import {
  GetAppAutoscalerPolicyAction,
  GetAppAutoscalerScalingHistoryAction,
  GetAppAutoscalerAppMetricAction,
  GetAppAutoscalerInsMetricAction,
  UpdateAppAutoscalerPolicyAction,
  DetachAppAutoscalerPolicyAction,
} from '../../../../../../store/actions/app-autoscaler.actions';
import {
  AppAutoscalerPolicy,
  AppAutoscalerScalingHistory,
  AppAutoscalerAppMetric,
  AppAutoscalerInsMetric
} from '../../../../../../store/types/app-autoscaler.types';
import { map, filter, distinctUntilChanged, first } from 'rxjs/operators';
import { getPaginationObservables } from '../../../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/app-state';
import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { ActionState } from '../../../../../../store/reducers/api-request-reducer/types';
import { selectUpdateInfo } from '../../../../../../store/selectors/api.selectors';
import { ConfirmationDialogConfig } from '../../../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../shared/components/confirmation-dialog.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';
import { DatePipe } from '@angular/common';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import {
  CfAppRoutesListConfigService,
} from '../../../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { CfOrgSpaceDataService } from '../../../../../../shared/data-services/cf-org-space-service.service';
import { RouterNav } from '../../../../../../store/actions/router.actions';
import { MetricTypes } from '../../../../../../store/helpers/autoscaler-helpers';

@Component({
  selector: 'app-autoscaler-tab',
  templateUrl: './autoscaler-tab.component.html',
  styleUrls: ['./autoscaler-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<AppState>,
        appService: ApplicationService,
        confirmDialog: ConfirmationDialogService,
        datePipe: DatePipe,
        cups: CurrentUserPermissionsService
      ) => {
        return new CfAppRoutesListConfigService(store, appService, confirmDialog, datePipe, cups);
      },
      deps: [Store, ApplicationService, ConfirmationDialogService, DatePipe, CurrentUserPermissionsService]
    },
    CfOrgSpaceDataService
  ]
})



export class AutoscalerTabComponent implements OnInit, OnDestroy {

  scalingRuleColumns: string[] = ['metric', 'condition', 'action'];
  specificDateColumns: string[] = ['from', 'to', 'init', 'min', 'max'];
  recurringScheduleColumns: string[] = ['effect', 'repeat', 'from', 'to', 'init', 'min', 'max'];
  scalingHistoryColumns: string[] = ['event', 'trigger', 'date', 'error'];
  metricTypes: string[] = MetricTypes;

  appAutoscalerPolicyService: EntityService;
  appAutoscalerScalingHistoryService: EntityService;

  appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;
  appAutoscalerScalingHistory$: Observable<AppAutoscalerScalingHistory>;

  private currentPolicy: any;
  public isEditing = false;
  public instanceMinCountCurrent: number;
  public instanceMinCountEdit: number;
  public instanceMaxCountCurrent: any;
  public instanceMaxCountEdit: any;

  appAutoscalerPolicyErrorSub: Subscription;
  appAutoscalerScalingHistoryErrorSub: Subscription;

  private appAutoscalerPolicySnackBarRef: MatSnackBarRef<SimpleSnackBar>;
  private appAutoscalerScalingHistorySnackBarRef: MatSnackBarRef<SimpleSnackBar>;

  // private confirmDialog: ConfirmationDialogService;
  private attachConfirmOk = 0;
  private detachConfirmOk = 0;

  appAutoscalerAppMetrics = {};
  appAutoscalerInsMetrics = {};
  appAutoscalerAppMetricNames = [];

  paramsMetrics = {
    'start-time': 0,
    'end-time': (new Date()).getTime().toString() + '000000',
    'page': '1',
    'results-per-page': '1',
    'order': 'desc'
  };
  paramsHistory = {
    'start-time': 0,
    'end-time': (new Date()).getTime().toString() + '000000',
    'page': '1',
    'results-per-page': '5',
    'order': 'desc'
  };

  ngOnDestroy(): void {
    if (this.appAutoscalerPolicySnackBarRef) {
      this.appAutoscalerPolicySnackBarRef.dismiss();
    }
    if (this.appAutoscalerScalingHistorySnackBarRef) {
      this.appAutoscalerScalingHistorySnackBarRef.dismiss();
    }
    if (this.appAutoscalerPolicyErrorSub) {
      this.appAutoscalerPolicyErrorSub.unsubscribe();
    }
    if (this.appAutoscalerScalingHistoryErrorSub) {
      this.appAutoscalerScalingHistoryErrorSub.unsubscribe();
    }
  }

  constructor(
    private store: Store<AppState>,
    private applicationService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private appAutoscalerPolicySnackBar: MatSnackBar,
    private appAutoscalerScalingHistorySnackBar: MatSnackBar,
    private confirmDialog: ConfirmationDialogService,
  ) {
  }

  ngOnInit() {
    this.appAutoscalerPolicyService = this.entityServiceFactory.create(
      appAutoscalerPolicySchemaKey,
      entityFactory(appAutoscalerPolicySchemaKey),
      this.applicationService.appGuid,
      new GetAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid),
      false
    );
    this.appAutoscalerScalingHistoryService = this.entityServiceFactory.create(
      appAutoscalerScalingHistorySchemaKey,
      entityFactory(appAutoscalerScalingHistorySchemaKey),
      this.applicationService.appGuid,
      new GetAppAutoscalerScalingHistoryAction('', this.applicationService.appGuid,
        this.applicationService.cfGuid, true, this.paramsHistory),
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
    this.appAutoscalerScalingHistory$ = this.appAutoscalerScalingHistoryService.entityObs$.pipe(
      map(({ entity }) => entity && entity.entity)
    );
    this.initErrorSub();
  }

  getAppMetric(metricName: string, trigger: any, params: any) {
    const action = new GetAppAutoscalerAppMetricAction(this.applicationService.appGuid,
      this.applicationService.cfGuid, metricName, true, trigger, params);
    return getPaginationObservables<AppAutoscalerAppMetric>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(appAutoscalerAppMetricSchemaKey)
      )
    }, false).entities$;
  }

  getInsMetric(metricName: string, trigger: any, params: any) {
    const action = new GetAppAutoscalerInsMetricAction(this.applicationService.appGuid,
      this.applicationService.cfGuid, metricName, true, trigger, params);
    return getPaginationObservables<AppAutoscalerInsMetric>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(appAutoscalerInsMetricSchemaKey)
      )
    }, false).entities$;
  }

  loadLatestMetricsUponPolicy(policyEntity) {
    if (policyEntity && policyEntity.entity && policyEntity.entity.scaling_rules_map) {
      this.appAutoscalerAppMetrics = {};
      Object.keys(policyEntity.entity.scaling_rules_map).map((metricName) => {
        this.appAutoscalerAppMetrics[metricName] =
          this.getAppMetric(metricName, policyEntity.entity.scaling_rules_map[metricName], this.paramsMetrics);
      });
    }
  }

  initErrorSub() {
    this.appAutoscalerPolicyErrorSub = this.appAutoscalerPolicyService.entityMonitor.entityRequest$.pipe(
      filter(request => !!request.error),
      map(request => request.message),
      distinctUntilChanged(),
    ).subscribe(errorMessage => {
      if (this.appAutoscalerPolicySnackBarRef) {
        this.appAutoscalerPolicySnackBarRef.dismiss();
      }
      this.appAutoscalerPolicySnackBarRef = this.appAutoscalerPolicySnackBar.open(errorMessage, 'Dismiss');
    });

    this.appAutoscalerScalingHistoryErrorSub = this.appAutoscalerScalingHistoryService.entityMonitor.entityRequest$.pipe(
      filter(request => !!request.error),
      map(request => request.message),
      distinctUntilChanged(),
    ).subscribe(errorMessage => {
      if (this.appAutoscalerScalingHistorySnackBarRef) {
        this.appAutoscalerScalingHistorySnackBarRef.dismiss();
      }
      this.appAutoscalerScalingHistorySnackBarRef = this.appAutoscalerScalingHistorySnackBar.open(errorMessage, 'Dismiss');
    });
  }

  diableAutoscaler() {
    const confirmation = new ConfirmationDialogConfig(
      'Detach And Delete Policy',
      'Are you sure you want to detach and delete the policy?.',
      'Detach and Delete',
      true
    );
    if (this.detachConfirmOk === 1) {
      this.detachConfirmOk = 0;
    } else {
      this.detachConfirmOk = 1;
    }
    this.confirmDialog.open(confirmation, () => {
      this.detachConfirmOk = 2;
      this.isEditing = false;
      const doUpdate = () => this.detachPolicy();
      doUpdate().pipe(
        first(),
      ).subscribe(actionState => {
        if (actionState.error) {
          this.appAutoscalerPolicySnackBarRef =
            this.appAutoscalerPolicySnackBar.open(`Failed to detach policy: ${actionState.message}`, 'Dismiss');
        }
      });
    });
    this.attachConfirmOk = 0;
  }

  createDefaultPolicy() {
    const confirmation = new ConfirmationDialogConfig(
      'Attach Default Policy',
      'Confirm to attach a default AutoScaler policy, you can update it later.',
      'Attach',
    );
    if (this.attachConfirmOk === 1) {
      this.attachConfirmOk = 0;
    } else {
      this.attachConfirmOk = 1;
    }
    this.confirmDialog.open(confirmation, () => {
      this.attachConfirmOk = 2;
      this.isEditing = false;
      this.currentPolicy = {
        'instance_min_count': 1,
        'instance_max_count': 10,
        'scaling_rules': [
          {
            'metric_type': 'memoryused',
            'stat_window_secs': 300,
            'breach_duration_secs': 600,
            'threshold': 10,
            'operator': '<=',
            'cool_down_secs': 300,
            'adjustment': '-2'
          },
          {
            'metric_type': 'responsetime',
            'stat_window_secs': 300,
            'breach_duration_secs': 600,
            'threshold': 40,
            'operator': '<',
            'cool_down_secs': 300,
            'adjustment': '-5'
          }
        ],
        'schedules': {
          'timezone': 'Asia/Shanghai',
          'recurring_schedule': [
            {
              'start_time': '10:00',
              'end_time': '18:00',
              'days_of_week': [
                1,
                2,
                3
              ],
              'instance_min_count': 1,
              'instance_max_count': 10,
              'initial_min_instance_count': 5
            }
          ],
          'specific_date': [
            {
              'start_date_time': '2099-06-02T10:00',
              'end_date_time': '2099-06-15T13:59',
              'instance_min_count': 1,
              'instance_max_count': 4,
              'initial_min_instance_count': 2
            }
          ]
        }
      };
      const doUpdate = () => this.updatePolicy();
      doUpdate().pipe(
        first(),
      ).subscribe(actionState => {
        if (actionState.error) {
          this.appAutoscalerPolicySnackBarRef =
            this.appAutoscalerPolicySnackBar.open(`Failed to create policy: ${actionState.message}`, 'Dismiss');
        }
      });
      this.detachConfirmOk = 0;
    });
  }

  updatePolicy(): Observable<ActionState> {
    this.store.dispatch(
      new UpdateAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy)
    );
    const actionState = selectUpdateInfo(appAutoscalerPolicySchemaKey,
      this.applicationService.appGuid,
      UpdateAppAutoscalerPolicyAction.updateKey);
    return this.store.select(actionState).pipe(filter(item => !!item));
  }

  detachPolicy(): Observable<ActionState> {
    this.store.dispatch(
      new DetachAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy)
    );
    const actionState = selectUpdateInfo(appAutoscalerPolicySchemaKey,
      this.applicationService.appGuid,
      UpdateAppAutoscalerPolicyAction.updateKey);
    return this.store.select(actionState).pipe(filter(item => !!item));
  }

  updatePolicyPage() {
    this.store.dispatch(new RouterNav({
      path: [
        'applications',
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
        'edit-autoscaler-policy'
      ],
      query: {
        // spaceGuid: app.app.entity.space_guid
      }
    }));
  }

  metricChartPage() {
    this.store.dispatch(new RouterNav({
      path: [
        'applications',
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
        'app-autoscaler-metric-chart-page'
      ],
      query: {
        // spaceGuid: app.app.entity.space_guid
      }
    }));
  }

  scaleHistoryPage() {
    this.store.dispatch(new RouterNav({
      path: [
        'applications',
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
        'app-autoscaler-scale-history-page'
      ],
      query: {
        // spaceGuid: app.app.entity.space_guid
      }
    }));
  }
}
