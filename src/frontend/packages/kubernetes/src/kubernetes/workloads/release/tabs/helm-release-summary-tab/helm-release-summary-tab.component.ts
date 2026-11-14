import { CommonModule } from '@angular/common';
import { Component, OnDestroy, signal, computed, inject, ChangeDetectionStrategy, Signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationDialogConfig, ConfirmationDialogService, EndpointsSignalService, SidePanelService, naturalCompare } from '@stratosui/core';
import { EMPTY, of, Subject } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

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

import { TailwindSnackBarRef, TailwindSnackBarService } from '@stratosui/core';
import {
  ResourceAlertPreviewComponent } from '../../../../analysis-report-viewer/resource-alert-preview/resource-alert-preview.component';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import { HelmReleaseChartData } from '../../../workload.types';
import { getIcon } from '../../icon-helper';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { ResourceAlert } from './../../../../services/analysis-report.types';

const cssVar = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

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
  public readonly isBusy: Signal<boolean>;
  private readonly DEFAULT_LOADING_MESSAGE = 'Retrieving Release Details';
  public readonly loadingMessage = computed(() => this.busyDeleting() ? 'Deleting Release' : this.DEFAULT_LOADING_MESSAGE);

  // Resolve adaptive theme colors once at construction. These feed the ring
  // chart domains; the component is not rebuilt on a live theme toggle, so the
  // colors reflect the theme active when this view loaded.
  private successChartColor = cssVar('--color-success');
  private completedChartColour = cssVar('--color-info');

  public readonly path: string;

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
      value: cssVar('--color-danger')
    }
  ];

  // Blue: #00B2E2
  // Yellow: #FFC107

  private deleted = false;
  // The last "Failed to delete release" message, stale once a retry deletes
  // the release.
  private deleteFailedSnackBar?: TailwindSnackBarRef<unknown>;
  // The analysis report whose alerts are shown on the resource cards; null for none
  private readonly analysisReport = signal<any>(null);
  private readonly analysisPick = new Subject<string | null>();
  public helmReleaseHelper = inject(HelmReleaseHelperService);
  private readonly newerChart = this.helmReleaseHelper.upgrade();
  private readonly latestChart = this.helmReleaseHelper.upgrade(true);
  private router = inject(Router);
  private endpointsSignals = inject(EndpointsSignalService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackbarService = inject(TailwindSnackBarService);
  public analyzerService = inject(KubernetesAnalysisService);
  private previewPanel = inject(SidePanelService);
  private helmDataService = inject(KubeHelmDataService);


  constructor() {
    // Only the report picked last is kept: choosing another one cancels the
    // request still in flight, so a slow answer cannot replace a newer pick.
    this.analysisPick.pipe(
      switchMap(id => id === null ? of(null) : this.analyzerService.getByID(this.helmReleaseHelper.endpointGuid, id).pipe(
        catchError(() => EMPTY)
      )),
      takeUntilDestroyed()
    ).subscribe(results => this.analysisReport.set(results));

    this.isBusy = computed(() =>
      this.helmReleaseHelper.isFetching() || this.busyDeleting()
    );

    this.path = `${this.helmReleaseHelper.namespace}/${this.helmReleaseHelper.releaseTitle}`;

    this.deleteReleaseConfirmation = new ConfirmationDialogConfig(
      `Delete Workload`,
      {
        textToMatch: this.helmReleaseHelper.releaseTitle
      },
      'Delete'
    );


  }

  // The newer chart version the release can be upgraded to, if any
  public readonly hasUpgrade = computed(() => this.newerChart()?.version ?? null);

  // Can we upgrade? Yes as long as the Helm Chart can be found
  public readonly canUpgrade = computed(() => !!this.latestChart());

  public readonly clusterName = computed(() =>
    // Empty until the endpoint has hydrated.
    this.endpointsSignals.endpoints()[this.helmReleaseHelper.endpointGuid]?.name ?? ''
  );

  private readonly chartStats = this.helmReleaseHelper.chartStats();

  // Pod and container counts, sorted for the ring charts
  public readonly chartData = computed<HelmReleaseChartData>(() => {
    const stats = this.chartStats();
    return {
      ...stats,
      containersChartData: [...stats.containersChartData].sort((a, b) => naturalCompare(a.name, b.name)),
      podsChartData: [...stats.podsChartData].sort((a, b) => naturalCompare(a.name, b.name))
    };
  });

  // The release's resources by kind, with the chosen report's alerts
  public readonly resources = computed(() => {
    const graph = this.helmReleaseHelper.graph();
    const resources: Record<string, any> = {};
    // Collect the resources
    Object.values(graph?.nodes ?? {}).forEach((node: any) => {
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
    this.applyAnalysis(resources, this.analysisReport());
    return Object.values(resources).sort((a: any, b: any) => naturalCompare(a.kind, b.kind));
  });

  public readonly hasResources = computed(() => !!this.chartData() && !!this.resources());

  public readonly hasAllResources = computed(() => this.hasResources() && this.resources().length > 0);

  public analysisChanged(report: any) {
    this.analysisPick.next(report === null ? null : report.id);
  }

  private startDelete() {
    this.busyDeleting.set(true);
  }

  private endDelete() {
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
        this.deleteFailedSnackBar = this.snackbarService.show('Failed to delete release', 'Close');
        console.error('Failed to delete release: ', err);
      });
    });
  }

  ngOnDestroy() {
    // Only this tab's own message: hide() would also dismiss other features'
    // messages.
    if (this.deleted) {
      this.deleteFailedSnackBar?.dismiss();
      this.deleteFailedSnackBar = undefined;
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
