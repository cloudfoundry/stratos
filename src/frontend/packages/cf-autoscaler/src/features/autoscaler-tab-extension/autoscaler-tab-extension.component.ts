import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BaseChartDirective } from 'ng2-charts';

import { TailwindSnackBarService, TailwindSnackBarRef } from '../../../../core/src/shared/services/tailwind-snackbar.service';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, first, map, pairwise, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { cfEntityCatalog } from '../../../../cloud-foundry/src/cf-entity-catalog';
import {
  applicationEntityType,
  organizationEntityType,
  spaceEntityType,
} from '../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { ApplicationMonitorService } from '../../../../cloud-foundry/src/features/applications/application-monitor.service';
import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { getGuids } from '../../../../cloud-foundry/src/features/applications/application/application-base.component';
import { CfCurrentUserPermissions } from '../../../../cloud-foundry/src/user-permissions/cf-user-permissions-checkers';
import { StratosTab, StratosTabType } from '../../../../core/src/core/extension/extension-service';
import { CurrentUserPermissionsService } from '../../../../core/src/core/permissions/current-user-permissions.service';
import { safeUnsubscribe } from '../../../../core/src/core/utils.service';
import { ConfirmationDialogConfig } from '../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { MetadataItemComponent } from '../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { NoContentMessageComponent } from '../../../../core/src/shared/components/no-content-message/no-content-message.component';
import { PageSubNavComponent } from '../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { PollingIndicatorComponent } from '../../../../core/src/shared/components/polling-indicator/polling-indicator.component';
import { TileComponent } from '../../../../core/src/shared/components/tile/tile/tile.component';
import { TileGridComponent } from '../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { RouterNav } from '../../../../store/src/actions/router.actions';
import { AppState } from '../../../../store/src/app-state';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import { EntityService } from '../../../../store/src/entity-service';
import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import {
  getCurrentPageRequestInfo,
  PaginationObservables,
} from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.types';
import { selectDeletionInfo } from '../../../../store/src/selectors/api.selectors';
import { APIResource } from '../../../../store/src/types/api.types';
import { fetchAutoscalerInfo, isAutoscalerEnabled } from '../../core/autoscaler-helpers/autoscaler-available';
import { AutoscalerConstants } from '../../core/autoscaler-helpers/autoscaler-util';
import {
  AutoscalerPaginationParams,
  DetachAppAutoscalerPolicyAction,
  GetAppAutoscalerAppMetricAction,
  GetAppAutoscalerPolicyAction,
  GetAppAutoscalerScalingHistoryAction,
} from '../../store/app-autoscaler.actions';
import {
  AppAutoscaleMetricChart,
  AppAutoscalerEvent,
  AppAutoscalerMetricData,
  AppAutoscalerPolicyLocal,
  AppScalingTrigger,
} from '../../store/app-autoscaler.types';
import { appAutoscalerAppMetricEntityType, autoscalerEntityFactory } from '../../store/autoscaler-entity-factory';
import { CardAppUsageComponent } from '../../../../cloud-foundry/src/shared/components/cards/card-app-usage/card-app-usage.component';
import { CardAutoscalerDefaultComponent } from '../../shared/card-autoscaler-default/card-autoscaler-default.component';

@StratosTab({
  type: StratosTabType.Application,
  label: 'Autoscale',
  link: 'autoscale',
  icon: 'meter',
  iconFont: 'stratos-icons',
  hidden: (store: Store<AppState>, esf: EntityServiceFactory, activatedRoute: ActivatedRoute, cups: CurrentUserPermissionsService) => {
    const endpointGuid = getGuids('cf')(activatedRoute) || window.location.pathname.split('/')[2];
    const appGuid = getGuids()(activatedRoute) || window.location.pathname.split('/')[3];
    const appEntService = cfEntityCatalog.application.store.getEntityService(appGuid, endpointGuid, {
      includeRelations: [
        createEntityRelationKey(applicationEntityType, spaceEntityType),
        createEntityRelationKey(spaceEntityType, organizationEntityType),
      ],
      populateMissing: true
    });

    const canEditApp$ = appEntService.waitForEntity$.pipe(
      switchMap(app => {
        // Null safety: ensure all nested properties exist before accessing
        const orgGuid = app?.entity?.entity?.space?.entity?.organization_guid;
        const spaceGuid = app?.entity?.entity?.space?.metadata?.guid;

        // If required data isn't available, deny permission (hide tab)
        if (!orgGuid || !spaceGuid) {
          return of(false);
        }

        return cups.can(
          CfCurrentUserPermissions.APPLICATION_EDIT,
          endpointGuid,
          orgGuid,
          spaceGuid
        );
      }),
    );

    const autoscalerEnabled = isAutoscalerEnabled(endpointGuid, esf);

    return canEditApp$.pipe(
      switchMap(canEditSpace => canEditSpace ? autoscalerEnabled : of(false)),
      map(can => !can)
    );
  }
})
@Component({
  selector: 'app-autoscaler-tab-extension',
  templateUrl: './autoscaler-tab-extension.component.html',
  styleUrls: ['./autoscaler-tab-extension.component.scss'],
  providers: [
    ApplicationMonitorService
  ],
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    PageSubNavComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardAutoscalerDefaultComponent,
    CardAppUsageComponent,
    MetadataItemComponent,
    PollingIndicatorComponent,
    NoContentMessageComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoscalerTabExtensionComponent implements OnInit, OnDestroy {

  canManageCredentials$: Observable<boolean>;

  scalingRuleColumns: string[] = ['metric', 'condition', 'action'];
  specificDateColumns: string[] = ['from', 'to', 'init', 'min', 'max'];
  recurringScheduleColumns: string[] = ['effect', 'repeat', 'from', 'to', 'init', 'min', 'max'];
  scalingHistoryColumns: string[] = ['event', 'trigger', 'date', 'error'];
  metricTypes: string[] = AutoscalerConstants.MetricTypes;

  appAutoscalerPolicyService: EntityService<APIResource<AppAutoscalerPolicyLocal>>;
  public appAutoscalerScalingHistoryService: PaginationObservables<APIResource<AppAutoscalerEvent>>;
  appAutoscalerPolicy$: Observable<AppAutoscalerPolicyLocal>;
  appAutoscalerPolicySafe$: Observable<AppAutoscalerPolicyLocal>;
  appAutoscalerScalingHistory$: Observable<AppAutoscalerEvent[]>;
  appAutoscalerAppMetricNames$: Observable<AppAutoscaleMetricChart[]>;

  public showNoPolicyMessage$: Observable<boolean>;
  public showAutoscalerHistory$: Observable<boolean>;

  public noPolicyMessageFirstLine = 'This application has no Autoscaler Policy';
  public noPolicyMessageSecondLine = {
    text: 'To create a policy click the + icon above'
  };

  private appAutoscalerPolicyErrorSub: Subscription;
  private appAutoscalerScalingHistoryErrorSub: Subscription;
  private appAutoscalerPolicySnackBarRef: TailwindSnackBarRef<any>;
  private appAutoscalerScalingHistorySnackBarRef: TailwindSnackBarRef<any>;
  private scalingHistoryAction: GetAppAutoscalerScalingHistoryAction;

  appAutoscalerAppMetrics = {};

  paramsMetrics: AutoscalerPaginationParams = {
    'start-time': ((new Date()).getTime() - 60000).toString() + '000000',
    'end-time': (new Date()).getTime().toString() + '000000',
    page: '1',
    'results-per-page': '1',
    'order-direction': 'desc'
  };
  paramsHistory: AutoscalerPaginationParams = {
    'start-time': '0',
    'end-time': (new Date()).getTime().toString() + '000000',
    page: '1',
    'results-per-page': '5',
    'order-direction': 'desc'
  };

  ngOnDestroy(): void {
    if (this.appAutoscalerPolicySnackBarRef) {
      this.appAutoscalerPolicySnackBarRef.dismiss();
    }
    if (this.appAutoscalerScalingHistorySnackBarRef) {
      this.appAutoscalerScalingHistorySnackBarRef.dismiss();
    }
    safeUnsubscribe(this.appAutoscalerPolicyErrorSub, this.appAutoscalerScalingHistoryErrorSub);
  }

  constructor(
    private store: Store<AppState>,
    private applicationService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private appAutoscalerPolicySnackBar: TailwindSnackBarService,
    private appAutoscalerScalingHistorySnackBar: TailwindSnackBarService,
    private confirmDialog: ConfirmationDialogService
  ) { }

  ngOnInit() {

    this.canManageCredentials$ = fetchAutoscalerInfo(
      this.applicationService.cfGuid,
      this.entityServiceFactory
    ).pipe(
      map(info => {
        // If autoscaler is not available (404 error), return false
        if (!info || info.entityRequestInfo.error || !info.entity || !info.entity.entity) {
          return false;
        }
        const build = info.entity.entity.build;
        // Null safety: ensure build exists and can be split
        if (!build || typeof build !== 'string') {
          return false;
        }
        const buildParts = build.split('.');
        if (buildParts.length === 0) {
          return false;
        }
        return Number.parseInt(buildParts[0], 10) >= 3;
      })
    );

    this.appAutoscalerPolicyService = this.entityServiceFactory.create(
      this.applicationService.appGuid,
      new GetAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid)
    );
    this.appAutoscalerPolicy$ = this.appAutoscalerPolicyService.entityObs$.pipe(
      filter(({ entityRequestInfo }) => entityRequestInfo && !entityRequestInfo.fetching),
      map(({ entity, }) => entity ? entity.entity : null),
      publishReplay(1),
      refCount()
    );
    this.appAutoscalerPolicySafe$ = this.appAutoscalerPolicyService.waitForEntity$.pipe(
      map(({ entity }) => entity && entity.entity),
      publishReplay(1),
      refCount()
    );

    this.loadLatestMetricsUponPolicy();

    this.appAutoscalerAppMetricNames$ = this.appAutoscalerPolicySafe$.pipe(
      map(entity => {
        // Null safety: ensure entity and scaling_rules_map exist
        if (!entity?.scaling_rules_map) {
          return [];
        }
        return Object.keys(entity.scaling_rules_map).map((name) => {
          const unit = entity.scaling_rules_map[name]?.upper?.[0]?.unit
            || entity.scaling_rules_map[name]?.lower?.[0]?.unit;
          return {
            name,
            unit,
          };
        });
      }),
    );

    this.scalingHistoryAction = new GetAppAutoscalerScalingHistoryAction(
      createEntityRelationPaginationKey(applicationEntityType, this.applicationService.appGuid, 'latest'),
      this.applicationService.appGuid,
      this.applicationService.cfGuid,
      false,
      this.paramsHistory
    );
    this.appAutoscalerScalingHistoryService = getPaginationObservables({
      store: this.store,
      action: this.scalingHistoryAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        this.scalingHistoryAction.paginationKey,
        this.scalingHistoryAction,
        true
      ),
    }, true);
    this.appAutoscalerScalingHistory$ = this.appAutoscalerScalingHistoryService.entities$.pipe(
      map(entities => entities.map(entity => entity.entity)),
      publishReplay(1),
      refCount()
    );
    this.initErrorSub();

    this.showAutoscalerHistory$ = combineLatest([
      this.appAutoscalerPolicy$,
      this.appAutoscalerScalingHistory$
    ]).pipe(
      map(([policy, history]) => !!policy || (!!history && history.length > 0)),
      publishReplay(1),
      refCount()
    );

    this.showNoPolicyMessage$ = combineLatest([
      this.appAutoscalerPolicy$,
      this.appAutoscalerScalingHistory$
    ]).pipe(
      map(([policy, history]) => !policy && (!history || history.length === 0)),
      publishReplay(1),
      refCount()
    );
  }

  getAppMetric(metricName: string, trigger: AppScalingTrigger, params: AutoscalerPaginationParams) {
    const action = new GetAppAutoscalerAppMetricAction(this.applicationService.appGuid,
      this.applicationService.cfGuid, metricName, true, trigger, params);
    this.store.dispatch(action);
    return getPaginationObservables<AppAutoscalerMetricData>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        autoscalerEntityFactory(appAutoscalerAppMetricEntityType),
        true
      )
    }, true).entities$;
  }

  loadLatestMetricsUponPolicy() {
    this.appAutoscalerPolicySafe$.pipe(
      first(),
    ).subscribe(appAutoscalerPolicy => {
      // Null safety: ensure policy exists before processing
      if (!appAutoscalerPolicy) {
        return;
      }
      this.paramsMetrics['start-time'] = ((new Date()).getTime() - 60000).toString() + '000000';
      this.paramsMetrics['end-time'] = (new Date()).getTime().toString() + '000000';
      if (appAutoscalerPolicy.scaling_rules_map) {
        this.appAutoscalerAppMetrics = Object.keys(appAutoscalerPolicy.scaling_rules_map).reduce((metricMap: Record<string, any>, metricName: string) => {
          metricMap[metricName] = this.getAppMetric(metricName, appAutoscalerPolicy.scaling_rules_map[metricName], this.paramsMetrics);
          return metricMap;
        }, {});
      }
    });
  }

  initErrorSub() {
    if (this.appAutoscalerPolicyErrorSub) {
      this.appAutoscalerScalingHistoryErrorSub.unsubscribe();
    }

    this.appAutoscalerPolicyErrorSub = this.appAutoscalerPolicyService.entityMonitor.entityRequest$.pipe(
      filter(response => {
        // Filter out expected errors (no policy, autoscaler unavailable)
        if (!response.error) {
          return false;
        }
        // Don't show error if policy simply doesn't exist (404 with noPolicy flag)
        if (response.response?.noPolicy) {
          return false;
        }
        // Don't show error if autoscaler is unavailable (expected when URL not configured)
        const isAutoscalerUnavailable = response.message?.includes('Autoscaler not available') ||
                                        response.message?.includes('Autoscaler plugin not available');
        if (isAutoscalerUnavailable) {
          return false;
        }
        return true;
      }),
      map(response => response.message),
      distinctUntilChanged(),
    ).subscribe(errorMessage => {
      if (this.appAutoscalerPolicySnackBarRef) {
        this.appAutoscalerPolicySnackBarRef.dismiss();
      }
      this.appAutoscalerPolicySnackBarRef = this.appAutoscalerPolicySnackBar.open(errorMessage, 'Dismiss');
    });

    if (this.appAutoscalerScalingHistoryErrorSub) {
      this.appAutoscalerScalingHistoryErrorSub.unsubscribe();
    }
    this.appAutoscalerScalingHistoryErrorSub = this.appAutoscalerScalingHistoryService.pagination$.pipe(
      map(pagination => getCurrentPageRequestInfo(pagination)),
      filter(request => {
        // Filter out expected autoscaler unavailability errors
        if (!request.error) {
          return false;
        }
        const isAutoscalerUnavailable = request.message?.includes('Autoscaler not available') ||
                                        request.message?.includes('Autoscaler plugin not available');
        return !isAutoscalerUnavailable;
      }),
      map(request => request.message),
      distinctUntilChanged(),
    ).subscribe(errorMessage => {
      if (this.appAutoscalerScalingHistorySnackBarRef) {
        this.appAutoscalerScalingHistorySnackBarRef.dismiss();
      }
      this.appAutoscalerScalingHistorySnackBarRef = this.appAutoscalerScalingHistorySnackBar.open(errorMessage, 'Dismiss');
    });
  }

  disableAutoscaler() {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Policy',
      'Are you sure you want to delete the policy?',
      'Delete',
      true
    );
    this.confirmDialog.open(confirmation, () => {
      this.detachPolicy().pipe(
        first(),
      ).subscribe(actionState => {
        if (actionState.error) {
          this.appAutoscalerPolicySnackBarRef =
            this.appAutoscalerPolicySnackBar.open(`Failed to detach policy: ${actionState.message}`, 'Dismiss');
        }
      });
    });
  }

  detachPolicy(): Observable<ActionState> {
    const action = new DetachAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid);
    this.store.dispatch(action);
    const entityKey = entityCatalog.getEntityKey(action);

    return this.store.select(selectDeletionInfo(entityKey, this.applicationService.appGuid)).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      map(([, newV]) => newV)
    );
  }

  updatePolicyPage = (isCreate = false) => {
    const query = isCreate ? {
      create: isCreate
    } : {};
    this.store.dispatch(new RouterNav({
      path: [
        'autoscaler',
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
        'edit-autoscaler-policy'
      ],
      query
    }));
  };

  metricChartPage() {
    this.store.dispatch(new RouterNav({
      path: [
        'autoscaler',
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
        'app-autoscaler-metric-page'
      ]
    }));
  }

  scaleHistoryPage() {
    this.store.dispatch(new RouterNav({
      path: [
        'autoscaler',
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
        'app-autoscaler-scale-history-page'
      ]
    }));
  }

  fetchScalingHistory() {
    this.paramsHistory['end-time'] = (new Date()).getTime().toString() + '000000';
    this.store.dispatch(this.scalingHistoryAction);
  }

  getMetricUnit(metricType: string, unit?: string) {
    return AutoscalerConstants.getMetricUnit(metricType, unit);
  }

  manageCredentialPage = () => {
    this.store.dispatch(new RouterNav({
      path: [
        'autoscaler',
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
        'edit-autoscaler-credential'
      ]
    }));
  };

  public gaugeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false
      }
    }
  };

  getGaugeData(metricData: any) {
    if (!metricData || !metricData[0]) {
      return { labels: [], datasets: [] };
    }

    // Null safety: ensure all nested properties exist
    const entity = metricData[0]?.entity;
    if (!entity?.latest?.target?.[0] || entity.chartMaxValue === undefined) {
      return { labels: [], datasets: [] };
    }

    const current = entity.latest.target[0];
    const max = entity.chartMaxValue;
    const remaining = max - current;

    return {
      labels: ['Current', 'Remaining'],
      datasets: [{
        data: [current, remaining],
        backgroundColor: [
          entity.latest.colorTarget?.[0] || '#2196F3', // Fallback color if missing
          '#E0E0E0'
        ]
      }]
    };
  }

}
