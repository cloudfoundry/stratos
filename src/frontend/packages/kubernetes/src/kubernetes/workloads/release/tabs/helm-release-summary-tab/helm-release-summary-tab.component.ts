import { CommonModule } from '@angular/common';
import {Component, OnDestroy, signal, computed, inject, ChangeDetectionStrategy, Injector, runInInjectionContext } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ConfirmationDialogConfig, ConfirmationDialogService, EndpointsSignalService, SidePanelService, naturalCompare } from '@stratosui/core';
import { Observable, of } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { KubeHelmDataService } from '../../../../../services/endpoint-data/kube-helm-data.service';

import {
  PageSubNavComponent,
  LoadingPageComponent,
  EntitySummaryTitleComponent,
  MetadataItemComponent,
  TileGridComponent,
  TileGroupComponent,
  TileComponent,
  RingChartComponent,
  CardNumberMetricComponent
} from '@stratosui/core';
import { AnalysisReportRunnerComponent } from '../../../../analysis-report-viewer/analysis-report-runner/analysis-report-runner.component';
import { AnalysisReportSelectorComponent } from '../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { WorkloadLiveReloadComponent } from '../../workload-live-reload/workload-live-reload.component';

import { SnackBarService } from '@stratosui/core';
import {
  ResourceAlertPreviewComponent } from '../../../../analysis-report-viewer/resource-alert-preview/resource-alert-preview.component';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import { HelmReleaseChartData } from '../../../workload.types';
import { getIcon } from '../../icon-helper';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { ResourceAlert } from './../../../../services/analysis-report.types';

@Component({
  selector: 'app-helm-release-summary-tab',
  templateUrl: './helm-release-summary-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageSubNavComponent,
    LoadingPageComponent,
    EntitySummaryTitleComponent,
    MetadataItemComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    RingChartComponent,
    CardNumberMetricComponent,
    AnalysisReportRunnerComponent,
    AnalysisReportSelectorComponent,
    WorkloadLiveReloadComponent
  ]
})
export class HelmReleaseSummaryTabComponent implements OnDestroy {
  // Confirmation dialogs
  deleteReleaseConfirmation: ConfirmationDialogConfig;

  private busyDeleting = signal<boolean>(false);
  // strict: the following observables are assigned in the constructor inside
  // runInInjectionContext, which TS can't see through the closure.
  public isBusy$!: Observable<boolean>;
  public hasResources$!: Observable<boolean>;
  public hasAllResources$!: Observable<boolean>;
  private readonly DEFAULT_LOADING_MESSAGE = 'Retrieving Release Details';
  public loadingMessage = this.DEFAULT_LOADING_MESSAGE;

  public podsChartData: any[] = [];
  public containersChartData: any[] = [];

  private successChartColor = '#4DD3A7';
  private completedChartColour = '#7aa3e5';

  public path!: string; // strict: assigned in the constructor inside runInInjectionContext

  public hasUpgrade$!: Observable<string>; // strict: assigned in the constructor inside runInInjectionContext

  // Can we upgrade? Yes as long as the Helm Chart can be found
  public canUpgrade$!: Observable<boolean>; // strict: assigned in the constructor inside runInInjectionContext

  public podChartColors = [
    {
      name: 'Running',
      value: this.successChartColor
    },
    {
      name: 'Completed',
      value: this.completedChartColour
    },
  ];

  public containersChartColors = [
    {
      name: 'Ready',
      value: this.successChartColor
    },
    {
      name: 'Not Ready',
      value: '#E7727D'
    }
  ];

  // Blue: #00B2E2
  // Yellow: #FFC107

  private deleted = false;
  // strict: assigned in the constructor inside runInInjectionContext.
  public chartData$!: Observable<HelmReleaseChartData>;
  public resources$!: Observable<any[]>;

  // Cached analysis report
  private analysisReport: any;

  private analysisReportId = signal<string | null>(null);
  private analysisReportUpdated$ = toObservable(this.analysisReportId).pipe(distinctUntilChanged());
  public helmReleaseHelper = inject(HelmReleaseHelperService);
  private router = inject(Router);
  private endpointsSignals = inject(EndpointsSignalService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackbarService = inject(SnackBarService);
  public analyzerService = inject(KubernetesAnalysisService);
  private previewPanel = inject(SidePanelService);
  private injector = inject(Injector);
  private helmDataService = inject(KubeHelmDataService);


  constructor() {
    // Convert signals within injection context
    runInInjectionContext(this.injector, () => {
      // Convert isFetching$ to signal for computed
      const isFetchingSignal = toSignal(
        this.helmReleaseHelper.isFetching$,
        { initialValue: true }
      );

      // Use computed for isBusy
      const isBusyComputed = computed(() =>
        isFetchingSignal() || this.busyDeleting()
      );

      // Provide as Observable for backward compatibility with template
      this.isBusy$ = toObservable(isBusyComputed);

      this.path = `${this.helmReleaseHelper.namespace}/${this.helmReleaseHelper.releaseTitle}`;

      this.chartData$ = this.helmReleaseHelper.fetchReleaseChartStats().pipe(
        distinctUntilChanged(),
        map((chartData: any) => ({
          ...chartData,
          containersChartData: chartData.containersChartData.sort((a: any, b: any) => naturalCompare(a.name, b.name)),
          podsChartData: chartData.podsChartData.sort((a: any, b: any) => naturalCompare(a.name, b.name))
        })
        )
      );

      this.hasUpgrade$ = this.helmReleaseHelper.hasUpgrade().pipe(map((v: any) => v ? v.version : null));

      // Can upgrade if the Chart is available
      this.canUpgrade$ = this.helmReleaseHelper.hasUpgrade(true).pipe(map((v: any) => !!v));

      // Convert release graph to signal
      const releaseGraphSignal = toSignal(
        this.helmReleaseHelper.fetchReleaseGraph(),
        { initialValue: { nodes: {} } as any }
      );

      // Compute resources based on graph and analysis report
      const resourcesComputed = computed(() => {
        const graph = releaseGraphSignal();
        const _ = this.analysisReportId(); // Dependency on analysis report changes

        const resources: Record<string, any> = {};
        // Collect the resources
        if (graph && graph.nodes) {
          Object.values(graph.nodes).forEach((node: any) => {
            if (!resources[node.data.kind]) {
              resources[node.data.kind] = {
                kind: node.data.kind,
                label: `${node.data.kind}s`,
                count: 0,
                statuses: [],
                icon: getIcon(node.data.kind)
              };
            }
            resources[node.data.kind].count++;
            resources[node.data.kind].statuses.push(node.data.status);
          });
        }
        this.applyAnalysis(resources, this.analysisReport);
        return Object.values(resources).sort((a: any, b: any) => naturalCompare(a.kind, b.kind));
      });

      this.resources$ = toObservable(resourcesComputed);


      // Convert chart data to signal
      const chartDataSignal = toSignal(
        this.chartData$,
        { initialValue: null as any }
      );

      // Compute hasResources
      const hasResourcesComputed = computed(() => {
        const chartData = chartDataSignal();
        const resources = resourcesComputed();
        return !!chartData && !!resources;
      });

      this.hasResources$ = toObservable(hasResourcesComputed);

      // Compute hasAllResources
      const hasAllResourcesComputed = computed(() => {
        const resources = resourcesComputed();
        const hasSome = hasResourcesComputed();
        return hasSome && resources && resources.length > 0;
      });

      this.hasAllResources$ = toObservable(hasAllResourcesComputed);
    });

    this.deleteReleaseConfirmation = new ConfirmationDialogConfig(
      `Delete Workload`,
      {
        textToMatch: this.helmReleaseHelper.releaseTitle
      },
      'Delete'
    );


  }

  public analysisChanged(report: any) {
    if (report === null) {
      // No report selected
      this.analysisReport = null;
      this.analysisReportId.set(null);
    } else {
      this.analyzerService.getByID(this.helmReleaseHelper.endpointGuid, report.id).subscribe((results: any) => {
        this.analysisReport = results;
        this.analysisReportId.set(report.id);
      });
    }
  }

  private startDelete() {
    this.loadingMessage = 'Deleting Release';
    this.busyDeleting.set(true);
  }

  private endDelete() {
    this.loadingMessage = this.DEFAULT_LOADING_MESSAGE;
    this.busyDeleting.set(false);
  }

  private completeDelete() {
    this.deleted = true;
    this.endDelete();
  }


  public deleteRelease() {
    this.confirmDialog.open(this.deleteReleaseConfirmation, () => {
      // Signal-native delete via KubeHelmDataService — handles HTTP +
      // optimistic local removal + cache refresh.
      this.startDelete();
      this.helmDataService.delete(
        this.helmReleaseHelper.endpointGuid,
        this.helmReleaseHelper.namespace,
        this.helmReleaseHelper.releaseTitle,
      ).then(() => {
        this.completeDelete();
        this.router.navigate(['./workloads']);
      }).catch((err: Error) => {
        this.endDelete();
        this.snackbarService.show('Failed to delete release', 'Close');
        console.error('Failed to delete release: ', err);
      });
    });
  }

  ngOnDestroy() {
    if (this.deleted) {
      this.snackbarService.hide();
    }
  }

  public createNamespaceLink(namespace: string): string[] {
    return [
      `/kubernetes`,
      this.helmReleaseHelper.endpointGuid,
      `namespaces`,
      namespace
    ];
  }

  public createClusterLink(): string[] {
    return [
      `/kubernetes`,
      this.helmReleaseHelper.endpointGuid,
    ];
  }

  public getClusterName(): Observable<string> {
    // Read the endpoint name from EndpointsSignalService instead of the
    // legacy `endpointsEntityRequestDataSelector`. Returns an empty string
    // if the endpoint hasn't hydrated yet — matches legacy `filter(!!e)`
    // behaviour by emitting a synchronous value the template can render.
    const endpoint = this.endpointsSignals.endpoints()[this.helmReleaseHelper.endpointGuid];
    return of(endpoint?.name ?? '');
  }

  private applyAnalysis(resources: any, report: any) {
    // Clear out existing alerts for all resources
    Object.values(resources).forEach((resource: any) => resource.alerts = []);

    if (report && Object.keys(resources).length > 0) {
      Object.values<ResourceAlert[]>(report.alerts).forEach((group: ResourceAlert[]) => {
        group.forEach(alert => {
          // Can we find a corresponding group in the resources?
          const res = Object.keys(resources).find((i) => i.toLowerCase() === alert.kind);
          if (res) {
            const resItem = resources[res];
            if (resItem) {
              resItem.alerts.push(alert);
            }
          }
        });
      });
    }
  }

  public showAlerts(alerts: any, resource: any) {
    this.previewPanel.show(
      ResourceAlertPreviewComponent,
      {
        resource,
        alerts }
    );
  }
}
