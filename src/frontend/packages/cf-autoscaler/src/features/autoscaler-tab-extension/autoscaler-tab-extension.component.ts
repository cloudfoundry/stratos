import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnDestroy, OnInit, Signal, computed, effect, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@stratosui/store';
import { BaseChartDirective } from 'ng2-charts';

import { combineLatest, Observable, of } from 'rxjs';
import { catchError, map, publishReplay, refCount, switchMap, take } from 'rxjs/operators';

import {
  TailwindSnackBarService,
  TailwindSnackBarRef,
  StratosTab,
  StratosTabType,
  CurrentUserPermissionsService,
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  CustomIconComponent,
  MetadataItemComponent,
  NoContentMessageComponent,
  PageSubNavComponent,
  PollingIndicatorComponent,
  TileComponent,
  TileGridComponent,
  TileGroupComponent
} from '@stratosui/core';
import {
  ApplicationMonitorService,
  ApplicationService,
  getGuids,
  CfCurrentUserPermissions,
  CardAppUsageComponent,
  StApp,
} from '@stratosui/cloud-foundry';
import {
  AppState,
  EntityServiceFactory,
} from '@stratosui/store';
import { isAutoscalerEnabled } from '../../core/autoscaler-helpers/autoscaler-available';
import { buildMetricData } from '../../core/autoscaler-helpers/autoscaler-transform-metric';
import { AutoscalerConstants } from '../../core/autoscaler-helpers/autoscaler-util';
import { AutoscalerInfoDataService } from '../../services/domain-data/autoscaler-info-data.service';
import { AutoscalerMetricDataService, AutoscalerMetricQueryParams } from '../../services/domain-data/autoscaler-metric-data.service';
import { AutoscalerPolicyDataService } from '../../services/domain-data/autoscaler-policy-data.service';
import { AutoscalerScalingHistoryDataService } from '../../services/domain-data/autoscaler-scaling-history-data.service';
import {
  AppAutoscaleMetricChart,
  AppAutoscalerEvent,
  AppAutoscalerMetricDataLocal,
  AppAutoscalerPolicyLocal,
  AppScalingTrigger } from '../../store/app-autoscaler.types';
import { CardAutoscalerDefaultComponent } from '../../shared/card-autoscaler-default/card-autoscaler-default.component';

// Re-typed pagination param shape kept locally so the template / handlers
// don't have to import the legacy AutoscalerPaginationParams from the
// actions module (those actions are being deleted in the same slice).
interface AutoscalerTabPaginationParams {
  'start-time': string;
  'end-time': string;
  page: string;
  'results-per-page': string;
  'order-direction': 'asc' | 'desc';
}

@StratosTab({
  type: StratosTabType.Application,
  label: 'Autoscale',
  link: 'autoscale',
  icon: 'meter',
  iconFont: 'stratos-icons',
  hidden: (
    _store: Store<AppState>,
    esf: EntityServiceFactory,
    activatedRoute: ActivatedRoute,
    cups: CurrentUserPermissionsService,
    http: HttpClient,
  ) => {
    const endpointGuid = getGuids('cf')(activatedRoute) || window.location.pathname.split('/')[2];
    const appGuid = getGuids()(activatedRoute) || window.location.pathname.split('/')[3];

    // Native app detail returns StApp with spaceGuid + orgGuid stitched
    // server-side (composeStAppWithSpaceOrg). Replaces the legacy
    // cfEntityCatalog.application.store.getEntityService + includeRelations
    // app→space→org chain.
    const canEditApp$ = http.get<StApp>(`/pp/v1/cf/apps/${endpointGuid}/${appGuid}`).pipe(
      switchMap(app => {
        const orgGuid = app?.orgGuid;
        const spaceGuid = app?.spaceGuid;
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
      catchError(() => of(false)),
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
    CustomIconComponent,
    MetadataItemComponent,
    PollingIndicatorComponent,
    NoContentMessageComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoscalerTabExtensionComponent implements OnInit, OnDestroy {
  private applicationService = inject(ApplicationService);
  private appAutoscalerPolicySnackBar = inject(TailwindSnackBarService);
  private appAutoscalerScalingHistorySnackBar = inject(TailwindSnackBarService);
  private confirmDialog = inject(ConfirmationDialogService);
  private autoscalerInfoData = inject(AutoscalerInfoDataService);
  private policyData = inject(AutoscalerPolicyDataService);
  private metricData = inject(AutoscalerMetricDataService);
  private scalingHistoryData = inject(AutoscalerScalingHistoryDataService);
  private router = inject(Router);
  private injector = inject(Injector);


  // Signal-native replacement for the legacy `canManageCredentials$`
  // Observable. Bound directly in the template via `canManageCredentials()`.
  // Source data comes from the per-endpoint cache populated by load()
  // in ngOnInit.
  canManageCredentials!: Signal<boolean>;

  scalingRuleColumns: string[] = ['metric', 'condition', 'action'];
  specificDateColumns: string[] = ['from', 'to', 'init', 'min', 'max'];
  recurringScheduleColumns: string[] = ['effect', 'repeat', 'from', 'to', 'init', 'min', 'max'];
  scalingHistoryColumns: string[] = ['event', 'trigger', 'date', 'error'];
  metricTypes: string[] = AutoscalerConstants.MetricTypes;

  // FWT-959 Track A wave-3 (A-effects-cleanup):
  // - Policy fetch + detach now flow through AutoscalerPolicyDataService;
  //   the legacy GetAppAutoscalerPolicyAction / DetachAppAutoscalerPolicyAction
  //   dispatches and the `selectDeletionInfo` chain are gone.
  // - Metric history reads now flow through AutoscalerMetricDataService;
  //   the legacy GetAppAutoscalerAppMetricAction dispatch is gone.
  // - Templates still bind via `*$ | async`, so the markup is unchanged —
  //   we bridge the data-service signals into Observables locally.
  appAutoscalerPolicy$!: Observable<AppAutoscalerPolicyLocal | null>;
  appAutoscalerPolicySafe$!: Observable<AppAutoscalerPolicyLocal | null>;
  appAutoscalerScalingHistory$!: Observable<AppAutoscalerEvent[]>;
  scalingHistoryLoading$!: Observable<boolean>;
  appAutoscalerAppMetricNames$!: Observable<AppAutoscaleMetricChart[]>;

  public showNoPolicyMessage$!: Observable<boolean>;
  public showAutoscalerHistory$!: Observable<boolean>;

  public noPolicyMessageFirstLine = 'This application has no Autoscaler Policy';
  public noPolicyMessageSecondLine = {
    text: 'To create a policy click the + icon above'
  };

  private appAutoscalerPolicySnackBarRef!: TailwindSnackBarRef<any>;
  private appAutoscalerScalingHistorySnackBarRef!: TailwindSnackBarRef<any>;

  appAutoscalerAppMetrics: Record<string, Observable<{ entity: AppAutoscalerMetricDataLocal }[]>> = {};

  paramsMetrics: AutoscalerTabPaginationParams = {
    'start-time': ((new Date()).getTime() - 60000).toString() + '000000',
    'end-time': (new Date()).getTime().toString() + '000000',
    page: '1',
    'results-per-page': '1',
    'order-direction': 'desc'
  };
  paramsHistory: AutoscalerTabPaginationParams = {
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
  }

  ngOnInit() {

    // Trigger autoscaler info fetch via the signal-native data service
    // (replaces the legacy fetchAutoscalerInfo helper + Store/Effects
    // path). canManageCredentials() reads the cached per-endpoint
    // signal — its value reflects whether the autoscaler build is
    // >= 3.x and credential management is exposed.
    const cfGuid = this.applicationService.cfGuid;
    const appGuid = this.applicationService.appGuid;
    this.autoscalerInfoData.load(cfGuid);
    this.canManageCredentials = this.autoscalerInfoData.canManageCredentials(cfGuid);

    // Policy fetch via the signal-native data service. The two Observable
    // wrappers preserve the legacy semantic split:
    //   appAutoscalerPolicy$     emits null while loading/no-policy and
    //                            the policy local form when loaded.
    //   appAutoscalerPolicySafe$ used to wait for entity (waitForEntity$);
    //                            here we filter out the in-flight state so
    //                            downstream scaling-rule mapping only fires
    //                            once we have a settled value. With the
    //                            data service that's the same observable —
    //                            it emits null until load() resolves and
    //                            then the policy.
    void this.policyData.load(cfGuid, appGuid);
    const policySig = this.policyData.policy(cfGuid, appGuid);
    this.appAutoscalerPolicy$ = toObservable(policySig, { injector: this.injector }).pipe(
      publishReplay(1),
      refCount(),
    );
    this.appAutoscalerPolicySafe$ = this.appAutoscalerPolicy$;

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
            unit };
        });
      }),
    );

    // Signal-native history wiring. fetchScalingHistory() refreshes
    // paramsHistory.end-time and triggers load(); the data service caches
    // results per (cnsi, app). The polling indicator binds via
    // scalingHistoryLoading$.
    this.appAutoscalerScalingHistory$ = toObservable(
      this.scalingHistoryData.events(cfGuid, appGuid),
      { injector: this.injector },
    ).pipe(publishReplay(1), refCount());
    this.scalingHistoryLoading$ = toObservable(
      this.scalingHistoryData.loading(cfGuid, appGuid),
      { injector: this.injector },
    ).pipe(publishReplay(1), refCount());
    this.fetchScalingHistory();
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

  getAppMetric(metricName: string, trigger: AppScalingTrigger, params: AutoscalerTabPaginationParams): Observable<{ entity: AppAutoscalerMetricDataLocal }[]> {
    const cfGuid = this.applicationService.cfGuid;
    const appGuid = this.applicationService.appGuid;
    const queryParams: AutoscalerMetricQueryParams = {
      'start-time': params['start-time'],
      'end-time': params['end-time'],
      page: params.page,
      'results-per-page': params['results-per-page'],
      'order-direction': params['order-direction'],
    };

    // Trigger the fetch (fire-and-forget); the metric data service caches
    // the raw resources and we transform them into the chartable local
    // form via buildMetricData here on the consumer side. This mirrors
    // the legacy effect-side `addMetric` / buildMetricData call without
    // routing through ngrx.
    void this.metricData.load(cfGuid, appGuid, metricName, queryParams);

    const rawSig = this.metricData.metrics(cfGuid, appGuid, metricName);
    const localSig = computed<{ entity: AppAutoscalerMetricDataLocal }[]>(() => {
      const resources = rawSig();
      if (!resources || resources.length === 0) {
        // Match the legacy "no metric data" emission so the template's
        // `@if (appAutoscalerAppMetrics[metric.name] | async; as metricData)`
        // branch stays inert until at least one sample lands.
        return [];
      }
      const local = buildMetricData(
        metricName,
        { resources, total_results: resources.length, total_pages: 1 } as any,
        parseInt(params['start-time'], 10),
        parseInt(params['end-time'], 10),
        true, // skipFormat — same flag the legacy dispatch passed
        trigger,
      );
      return [{ entity: local }];
    });

    return toObservable(localSig, { injector: this.injector }).pipe(
      publishReplay(1),
      refCount(),
    );
  }

  loadLatestMetricsUponPolicy() {
    this.appAutoscalerPolicySafe$.pipe(
      take(1),
    ).subscribe(appAutoscalerPolicy => {
      // Null safety: ensure policy exists before processing
      if (!appAutoscalerPolicy) {
        return;
      }
      this.paramsMetrics['start-time'] = ((new Date()).getTime() - 60000).toString() + '000000';
      this.paramsMetrics['end-time'] = (new Date()).getTime().toString() + '000000';
      if (appAutoscalerPolicy.scaling_rules_map) {
        this.appAutoscalerAppMetrics = Object.keys(appAutoscalerPolicy.scaling_rules_map).reduce((metricMap: Record<string, Observable<{ entity: AppAutoscalerMetricDataLocal }[]>>, metricName: string) => {
          metricMap[metricName] = this.getAppMetric(metricName, appAutoscalerPolicy.scaling_rules_map[metricName], this.paramsMetrics);
          return metricMap;
        }, {});
      }
    });
  }

  initErrorSub() {
    const cfGuid = this.applicationService.cfGuid;
    const appGuid = this.applicationService.appGuid;

    // Signal-native policy error surfacing. Replaces the legacy
    // EntityService.entityMonitor.entityRequest$ subscription. The data
    // service distinguishes "no policy" (404 → noPolicy=true, error=null)
    // from real failures (error message), so we only need to surface
    // real errors here. The "Autoscaler not available" / "plugin not
    // available" filter from the legacy code is preserved.
    let lastPolicyError: string | null = null;
    effect(() => {
      const errorMessage = this.policyData.error(cfGuid, appGuid)();
      if (!errorMessage || errorMessage === lastPolicyError) {
        return;
      }
      const isAutoscalerUnavailable = errorMessage.includes('Autoscaler not available') ||
                                      errorMessage.includes('Autoscaler plugin not available');
      lastPolicyError = errorMessage;
      if (isAutoscalerUnavailable) {
        return;
      }
      if (this.appAutoscalerPolicySnackBarRef) {
        this.appAutoscalerPolicySnackBarRef.dismiss();
      }
      this.appAutoscalerPolicySnackBarRef = this.appAutoscalerPolicySnackBar.open(errorMessage, 'Dismiss');
    }, { injector: this.injector });

    // Signal-native scaling-history error surfacing. Effect re-runs whenever
    // the data-service error signal changes; mirrors the legacy
    // distinctUntilChanged + isAutoscalerUnavailable filter.
    let lastHistoryError: string | null = null;
    effect(() => {
      const errorMessage = this.scalingHistoryData
        .error(cfGuid, appGuid)();
      if (!errorMessage || errorMessage === lastHistoryError) {
        return;
      }
      const isAutoscalerUnavailable = errorMessage.includes('Autoscaler not available') ||
                                      errorMessage.includes('Autoscaler plugin not available');
      if (isAutoscalerUnavailable) {
        lastHistoryError = errorMessage;
        return;
      }
      lastHistoryError = errorMessage;
      if (this.appAutoscalerScalingHistorySnackBarRef) {
        this.appAutoscalerScalingHistorySnackBarRef.dismiss();
      }
      this.appAutoscalerScalingHistorySnackBarRef =
        this.appAutoscalerScalingHistorySnackBar.open(errorMessage, 'Dismiss');
    }, { injector: this.injector });
  }

  disableAutoscaler() {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Policy',
      'Are you sure you want to delete the policy?',
      'Delete',
      true
    );
    this.confirmDialog.open(confirmation, () => {
      const cfGuid = this.applicationService.cfGuid;
      const appGuid = this.applicationService.appGuid;
      // Wave-3 (A-effects-cleanup): replaces the dispatch + selectDeletionInfo
      // pairwise watcher with a direct await on the data service's detach
      // promise. Failure surfacing matches the legacy snackbar UX —
      // deletionError() carries the same message extractAutoscalerError()
      // would have produced.
      this.policyData.detach(cfGuid, appGuid).catch(() => {
        // Success path: data service has cleared the cached policy +
        // flipped noPolicy(); the template re-renders via the policy
        // signal bridge automatically. Failure path: surface the
        // deletion error message in the same snackbar style as the
        // legacy ActionState.message.
        const message = this.policyData.deletionError(cfGuid, appGuid)() ?? 'unknown error';
        this.appAutoscalerPolicySnackBarRef =
          this.appAutoscalerPolicySnackBar.open(`Failed to detach policy: ${message}`, 'Dismiss');
      });
    });
  }

  updatePolicyPage = (isCreate = false) => {
    const queryParams = isCreate ? { create: isCreate } : {};
    void this.router.navigate(
      [
        'autoscaler',
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
        'edit-autoscaler-policy',
      ],
      { queryParams },
    );
  };

  metricChartPage() {
    void this.router.navigate([
      'autoscaler',
      this.applicationService.cfGuid,
      this.applicationService.appGuid,
      'app-autoscaler-metric-page',
    ]);
  }

  scaleHistoryPage() {
    void this.router.navigate([
      'autoscaler',
      this.applicationService.cfGuid,
      this.applicationService.appGuid,
      'app-autoscaler-scale-history-page',
    ]);
  }

  fetchScalingHistory() {
    this.paramsHistory['end-time'] = (new Date()).getTime().toString() + '000000';
    // Fire-and-forget; errors surface via the data-service error signal.
    void this.scalingHistoryData.load(
      this.applicationService.cfGuid,
      this.applicationService.appGuid,
      this.paramsHistory as Record<string, string>,
    );
  }

  getMetricUnit(metricType: string, unit?: string) {
    return AutoscalerConstants.getMetricUnit(metricType, unit);
  }

  manageCredentialPage = () => {
    void this.router.navigate([
      'autoscaler',
      this.applicationService.cfGuid,
      this.applicationService.appGuid,
      'edit-autoscaler-credential',
    ]);
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
